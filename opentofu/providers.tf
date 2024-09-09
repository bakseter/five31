terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "1.13.0"
    }

    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.1.0"
    }
  }

  cloud {
    organization = "bakseter"
    hostname     = "app.terraform.io"

    workspaces {
      name = "531-prod"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_token
}

provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
}
