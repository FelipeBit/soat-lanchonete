# ADR-001: Escolha do Amazon Aurora RDS

## Status
Aceito

## Contexto
O projeto SOAT (Sistema de Autoatendimento) necessita de uma solução de banco de dados robusta, escalável e gerenciada para suportar operações de e-commerce com alta disponibilidade e performance. O sistema lida com dados críticos como pedidos, clientes, produtos e pagamentos que requerem consistência e confiabilidade.

## Decisão
Escolhemos o **Amazon Aurora RDS** como solução de banco de dados principal para o projeto SOAT.

## Alternativas Consideradas

### 1. RDS MySQL/PostgreSQL Padrão
- **Prós**: Custo menor, familiaridade da equipe
- **Contras**: Limitações de escalabilidade, performance inferior, backup manual

### 2. DynamoDB
- **Prós**: Escalabilidade automática, NoSQL
- **Contras**: Não adequado para relacionamentos complexos, curva de aprendizado

### 3. Self-managed MySQL/PostgreSQL
- **Prós**: Controle total, customização
- **Contras**: Overhead de manutenção, responsabilidade de backup/segurança

## Justificativa da Decisão

### 1. **Performance Superior**
- Aurora oferece até 3x a performance do MySQL padrão
- Storage otimizado com replicação em 6 cópias em 3 AZs
- Cache de buffer pool otimizado automaticamente

### 2. **Escalabilidade Automática**
- **Aurora Serverless v2**: Escala automaticamente de 0.5 a 4 ACUs
- Reduz custos durante períodos de baixa utilização
- Escala instantaneamente durante picos de tráfego

### 3. **Alta Disponibilidade**
- Multi-AZ por padrão
- Failover automático em menos de 30 segundos
- Backup contínuo com Point-in-Time Recovery

### 4. **Segurança Avançada**
- Criptografia em repouso e em trânsito
- Integração com AWS Secrets Manager
- Network isolation com VPC e Security Groups
- Auditoria completa com CloudTrail

### 5. **Operações Gerenciadas**
- Backup automático e gerenciado
- Patches de segurança automáticos
- Monitoramento integrado com CloudWatch
- Reduz overhead operacional da equipe

### 6. **Compatibilidade**
- Compatível com MySQL 8.0
- Migração simples de aplicações existentes
- Suporte completo ao TypeORM

## Implementação

### Configuração Escolhida
- **Engine**: Aurora MySQL 8.0
- **Tipo**: Serverless v2
- **Capacidade**: 0.5 - 4 ACUs (Auto-scaling)
- **Instâncias**: 2 (Writer + Reader)
- **Backup**: 7 dias de retenção
- **Criptografia**: Habilitada

### Benefícios para o Projeto SOAT
1. **E-commerce**: Suporta picos de tráfego durante promoções
2. **Pagamentos**: Transações ACID garantidas
3. **Relatórios**: Reader endpoints para consultas analíticas
4. **Compliance**: Auditoria e criptografia para dados sensíveis

## Consequências

### Positivas
- ✅ Performance superior para operações de e-commerce
- ✅ Escalabilidade automática reduz custos
- ✅ Alta disponibilidade garante uptime do negócio
- ✅ Operações gerenciadas reduzem overhead da equipe
- ✅ Segurança enterprise-grade

### Negativas
- ❌ Custo inicial maior que RDS padrão
- ❌ Vendor lock-in com AWS
- ❌ Curva de aprendizado para otimizações específicas

## Monitoramento e Métricas

### KPIs Definidos
- **Performance**: Latência de queries < 10ms
- **Disponibilidade**: 99.9% uptime
- **Escalabilidade**: Auto-scaling sem intervenção manual
- **Custo**: Otimização automática de recursos

### Alertas Configurados
- CPU > 80% por 5 minutos
- Conexões > 80% do limite
- Storage > 85% da capacidade
- Failover events

## Conclusão

A escolha do Amazon Aurora RDS para o projeto SOAT foi baseada na necessidade de uma solução enterprise-grade que oferece performance superior, escalabilidade automática e operações gerenciadas. Apesar do custo inicial maior, os benefícios de alta disponibilidade, segurança avançada e redução de overhead operacional justificam a decisão para um sistema crítico de e-commerce.

---

**Data**: 05/10/2025  
**Autor**: Felipe da Silva Bittencourt
**Revisores**: Tech Lead, DevOps Lead  
**Próxima Revisão**: 05/01/2026
