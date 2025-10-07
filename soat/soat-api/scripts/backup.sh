#!/bin/bash

# Script de Backup e Restore - SOAT API
# Uso: ./scripts/backup.sh [backup|restore] [dev|staging|prod] [opções]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configurações de ambiente
ENV_CONFIGS=(
    "dev:soat-api-dev:fastfood_dev:postgres-dev:5432:postgres:dev-password"
    "staging:soat-api-staging:fastfood_staging:postgres-staging:5432:postgres:staging-password"
    "prod:soat-api-prod:fastfood_prod:postgres-prod:5432:postgres:prod-password"
)

# Função para obter configuração do ambiente
get_env_config() {
    local env=$1
    for config in "${ENV_CONFIGS[@]}"; do
        IFS=':' read -r env_name namespace database host port user password <<< "$config"
        if [ "$env_name" = "$env" ]; then
            echo "$namespace:$database:$host:$port:$user:$password"
            return 0
        fi
    done
    error "Ambiente não encontrado: $env"
}

# Função para backup
backup_database() {
    local env=$1
    local backup_dir=${2:-"./backups"}
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/soat-api-${env}-${timestamp}.sql"
    
    # Obter configuração do ambiente
    local config=$(get_env_config $env)
    IFS=':' read -r namespace database host port user password <<< "$config"
    
    log "Iniciando backup do ambiente: $env"
    log "Namespace: $namespace"
    log "Database: $database"
    log "Host: $host"
    
    # Criar diretório de backup se não existir
    mkdir -p "$backup_dir"
    
    # Verificar se o pod do PostgreSQL está rodando
    if ! kubectl get pods -n $namespace | grep -q "$host.*Running"; then
        error "Pod do PostgreSQL não está rodando no namespace $namespace"
    fi
    
    # Executar backup usando kubectl exec
    log "Executando backup..."
    kubectl exec -n $namespace deployment/$host -- pg_dump -h localhost -p $port -U $user -d $database > "$backup_file"
    
    if [ $? -eq 0 ]; then
        success "Backup concluído com sucesso: $backup_file"
        
        # Comprimir backup
        log "Comprimindo backup..."
        gzip "$backup_file"
        success "Backup comprimido: ${backup_file}.gz"
        
        # Mostrar tamanho do arquivo
        local size=$(du -h "${backup_file}.gz" | cut -f1)
        log "Tamanho do backup: $size"
        
        # Limpar backups antigos (manter apenas os últimos 10)
        cleanup_old_backups "$backup_dir" "$env" 10
    else
        error "Falha no backup"
    fi
}

# Função para restore
restore_database() {
    local env=$1
    local backup_file=$2
    
    if [ -z "$backup_file" ]; then
        error "Arquivo de backup não especificado"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Arquivo de backup não encontrado: $backup_file"
    fi
    
    # Obter configuração do ambiente
    local config=$(get_env_config $env)
    IFS=':' read -r namespace database host port user password <<< "$config"
    
    log "Iniciando restore do ambiente: $env"
    log "Arquivo: $backup_file"
    log "Namespace: $namespace"
    log "Database: $database"
    
    # Confirmar restore
    read -p "Tem certeza que deseja fazer restore no ambiente $env? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Restore cancelado"
        exit 0
    fi
    
    # Verificar se o pod do PostgreSQL está rodando
    if ! kubectl get pods -n $namespace | grep -q "$host.*Running"; then
        error "Pod do PostgreSQL não está rodando no namespace $namespace"
    fi
    
    # Descomprimir se necessário
    local temp_file=""
    if [[ "$backup_file" == *.gz ]]; then
        log "Descomprimindo backup..."
        temp_file=$(mktemp)
        gunzip -c "$backup_file" > "$temp_file"
        backup_file="$temp_file"
    fi
    
    # Executar restore
    log "Executando restore..."
    kubectl exec -n $namespace deployment/$host -- psql -h localhost -p $port -U $user -d $database < "$backup_file"
    
    if [ $? -eq 0 ]; then
        success "Restore concluído com sucesso!"
    else
        error "Falha no restore"
    fi
    
    # Limpar arquivo temporário
    if [ -n "$temp_file" ] && [ -f "$temp_file" ]; then
        rm "$temp_file"
    fi
}

# Função para limpar backups antigos
cleanup_old_backups() {
    local backup_dir=$1
    local env=$2
    local keep_count=$3
    
    log "Limpando backups antigos (mantendo os últimos $keep_count)..."
    
    # Listar backups do ambiente ordenados por data (mais recentes primeiro)
    local backups=($(ls -t "${backup_dir}/soat-api-${env}-"*.sql.gz 2>/dev/null || true))
    
    # Remover backups antigos
    if [ ${#backups[@]} -gt $keep_count ]; then
        local to_remove=${backups[@]:$keep_count}
        for backup in $to_remove; do
            log "Removendo backup antigo: $(basename $backup)"
            rm "$backup"
        done
        success "Limpeza concluída. Mantidos ${keep_count} backups mais recentes."
    else
        log "Nenhum backup antigo para remover."
    fi
}

# Função para listar backups
list_backups() {
    local backup_dir=${1:-"./backups"}
    local env=$2
    
    log "Listando backups disponíveis:"
    echo ""
    
    if [ -z "$env" ]; then
        # Listar todos os backups
        for env_name in dev staging prod; do
            echo "=== Ambiente: $env_name ==="
            local backups=($(ls -t "${backup_dir}/soat-api-${env_name}-"*.sql.gz 2>/dev/null || true))
            if [ ${#backups[@]} -eq 0 ]; then
                echo "Nenhum backup encontrado"
            else
                for backup in "${backups[@]}"; do
                    local size=$(du -h "$backup" | cut -f1)
                    local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null)
                    echo "  $(basename $backup) - $size - $date"
                done
            fi
            echo ""
        done
    else
        # Listar backups de um ambiente específico
        echo "=== Ambiente: $env ==="
        local backups=($(ls -t "${backup_dir}/soat-api-${env}-"*.sql.gz 2>/dev/null || true))
        if [ ${#backups[@]} -eq 0 ]; then
            echo "Nenhum backup encontrado"
        else
            for backup in "${backups[@]}"; do
                local size=$(du -h "$backup" | cut -f1)
                local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null)
                echo "  $(basename $backup) - $size - $date"
            done
        fi
    fi
}

# Função para verificar status do banco
check_database_status() {
    local env=$1
    
    # Obter configuração do ambiente
    local config=$(get_env_config $env)
    IFS=':' read -r namespace database host port user password <<< "$config"
    
    log "Verificando status do banco no ambiente: $env"
    
    # Verificar se o pod está rodando
    if kubectl get pods -n $namespace | grep -q "$host.*Running"; then
        success "Pod do PostgreSQL está rodando"
        
        # Verificar conectividade
        if kubectl exec -n $namespace deployment/$host -- pg_isready -h localhost -p $port -U $user; then
            success "Banco de dados está acessível"
            
            # Verificar tamanho do banco
            local db_size=$(kubectl exec -n $namespace deployment/$host -- psql -h localhost -p $port -U $user -d $database -t -c "SELECT pg_size_pretty(pg_database_size('$database'));" 2>/dev/null | xargs)
            log "Tamanho do banco: $db_size"
            
            # Verificar número de tabelas
            local table_count=$(kubectl exec -n $namespace deployment/$host -- psql -h localhost -p $port -U $user -d $database -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
            log "Número de tabelas: $table_count"
        else
            error "Banco de dados não está acessível"
        fi
    else
        error "Pod do PostgreSQL não está rodando"
    fi
}

# Função para mostrar ajuda
show_help() {
    echo "Script de Backup e Restore - SOAT API"
    echo ""
    echo "Uso: $0 [ação] [ambiente] [opções]"
    echo ""
    echo "Ações:"
    echo "  backup    - Fazer backup do banco de dados"
    echo "  restore   - Fazer restore do banco de dados"
    echo "  list      - Listar backups disponíveis"
    echo "  status    - Verificar status do banco de dados"
    echo ""
    echo "Ambientes:"
    echo "  dev       - Ambiente de desenvolvimento"
    echo "  staging   - Ambiente de staging"
    echo "  prod      - Ambiente de produção"
    echo ""
    echo "Opções:"
    echo "  --backup-dir=DIR    - Diretório para backups (padrão: ./backups)"
    echo "  --file=FILE         - Arquivo de backup para restore"
    echo "  --keep=N            - Número de backups para manter (padrão: 10)"
    echo "  --help              - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 backup dev"
    echo "  $0 backup prod --backup-dir=/tmp/backups"
    echo "  $0 restore dev --file=./backups/soat-api-dev-20231201_120000.sql.gz"
    echo "  $0 list"
    echo "  $0 status prod"
}

# Main
main() {
    # Verificar se kubectl está instalado
    if ! command -v kubectl &> /dev/null; then
        error "kubectl não está instalado"
    fi
    
    # Verificar argumentos
    if [ $# -lt 1 ]; then
        show_help
        exit 1
    fi
    
    local action=$1
    local environment=$2
    shift 2
    
    # Processar opções
    local backup_dir="./backups"
    local backup_file=""
    local keep_count=10
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-dir=*)
                backup_dir="${1#*=}"
                shift
                ;;
            --file=*)
                backup_file="${1#*=}"
                shift
                ;;
            --keep=*)
                keep_count="${1#*=}"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Opção desconhecida: $1"
                ;;
        esac
    done
    
    # Executar ação
    case $action in
        backup)
            if [ -z "$environment" ]; then
                error "Ambiente não especificado para backup"
            fi
            backup_database "$environment" "$backup_dir"
            ;;
        restore)
            if [ -z "$environment" ]; then
                error "Ambiente não especificado para restore"
            fi
            if [ -z "$backup_file" ]; then
                error "Arquivo de backup não especificado"
            fi
            restore_database "$environment" "$backup_file"
            ;;
        list)
            list_backups "$backup_dir" "$environment"
            ;;
        status)
            if [ -z "$environment" ]; then
                error "Ambiente não especificado para status"
            fi
            check_database_status "$environment"
            ;;
        *)
            error "Ação inválida: $action"
            ;;
    esac
}

# Executar main
main "$@" 