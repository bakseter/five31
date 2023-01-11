terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "2.25.2"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "0.11.4"
    }
  }
}

// Vercel

provider "vercel" {
  api_token = var.vercel_token
}

resource "vercel_project" "project" {
  name                       = "531-frontend"
  framework                  = "nextjs"
  root_directory             = "frontend"
  serverless_function_region = "arn1"
  install_command            = "yarn --frozen-lockfile"

  git_repository = {
    type = "github"
    repo = "bakseter/531"
  }
}

resource "vercel_project_environment_variable" "backend_url" {
  project_id = vercel_project.project.id
  key        = "NEXT_PUBLIC_BACKEND_URL"
  value      = "https://api.bakseter.net"
  target     = ["production"]
}

resource "vercel_project_environment_variable" "nextauth_username" {
  project_id = vercel_project.project.id
  key        = "NEXTAUTH_USERNAME"
  value      = var.nextauth_username
  target     = ["production"]
}

resource "vercel_project_environment_variable" "nextauth_password" {
  project_id = vercel_project.project.id
  key        = "NEXTAUTH_PASSWORD"
  value      = var.nextauth_password
  target     = ["production"]
}

resource "vercel_project_environment_variable" "nextauth_secret" {
  project_id = vercel_project.project.id
  key        = "NEXTAUTH_SECRET"
  value      = var.nextauth_secret
  target     = ["production"]
}

resource "vercel_project_environment_variable" "admin_key" {
  project_id = vercel_project.project.id
  key        = "ADMIN_KEY"
  value      = var.admin_key
  target     = ["production"]
}

// DigitalOcean

provider "digitalocean" {
  token = var.do_token
}

data "digitalocean_image" "img" {
  slug = "docker-20-04"
}

resource "digitalocean_ssh_key" "ssh" {
  name       = var.ssh_key_name
  public_key = file(var.ssh_key_path)
}

resource "digitalocean_droplet" "drop" {
  image    = data.digitalocean_image.img.id
  name     = "backend-1"
  region   = "ams3"
  size     = "s-1vcpu-1gb"
  ssh_keys = [digitalocean_ssh_key.ssh.fingerprint]
}

resource "digitalocean_project" "project" {
  name        = "531"
  description = "5/3/1 workout plan"
  purpose     = "Web backend"
  resources = [
    digitalocean_droplet.drop.urn,
    "do:domain:bakseter.net"
  ]
  is_default = true
}
