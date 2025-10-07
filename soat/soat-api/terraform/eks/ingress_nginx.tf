resource "kubernetes_namespace" "ingress_nginx" {
  metadata {
    name = "ingress-nginx"
  }
}

resource "helm_release" "ingress_nginx" {
  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  namespace  = kubernetes_namespace.ingress_nginx.metadata[0].name
  version    = "4.11.1"

  depends_on = [aws_eks_fargate_profile.default]

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }

  # Fargate requires using Deployment, not DaemonSet
  set {
    name  = "controller.kind"
    value = "Deployment"
  }
}


