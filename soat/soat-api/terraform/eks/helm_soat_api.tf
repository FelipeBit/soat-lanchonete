resource "helm_release" "soat_api" {
  name       = "soat-api"
  chart      = "${path.root}/../../soat-api/helm/soat-api"
  namespace  = kubernetes_namespace.soat.metadata[0].name

  depends_on = [
    aws_eks_fargate_profile.default,
    helm_release.ingress_nginx
  ]

  set {
    name  = "image.repository"
    value = var.soat_api_image
  }
  set {
    name  = "image.tag"
    value = var.soat_api_image_tag
  }
  set {
    name  = "service.port"
    value = 3000
  }
  set {
    name  = "ingress.enabled"
    value = "true"
  }
  set {
    name  = "ingress.className"
    value = "nginx"
  }
  set {
    name  = "ingress.hosts[0].host"
    value = var.domain_name
  }
  set {
    name  = "ingress.hosts[0].paths[0].path"
    value = "/"
  }
  set {
    name  = "ingress.hosts[0].paths[0].pathType"
    value = "Prefix"
  }
}


