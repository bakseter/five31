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

  git_repository = {
    type = "github"
    repo = "bakseter/531"
  }
}

resource "vercel_project_environment_variable" "backend_url" {
  project_id = vercel_project.project.id
  key        = "NEXT_PUBLIC_BACKEND_URL"
  value      = "http://${digitalocean_droplet.drop.ipv4_address}"
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
  resources   = [digitalocean_droplet.drop.urn]
  is_default  = true
}
