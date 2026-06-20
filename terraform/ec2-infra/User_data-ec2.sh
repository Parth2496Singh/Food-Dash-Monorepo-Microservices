#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

install_docker(){

    echo "Removing old Docker versions (if any)..."
    sudo apt remove -y docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc || true
    sudo apt autoremove -y || true

    echo "Updating system..."
    sudo apt update
    sudo apt install -y ca-certificates curl gnupg git

    echo "Creating keyring..."
    sudo install -m 0755 -d /etc/apt/keyrings

    sudo rm -f /etc/apt/keyrings/docker.gpg

    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
        sudo gpg --batch --yes --dearmor -o /etc/apt/keyrings/docker.gpg

    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo "Adding Docker repository..."
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    echo "Installing Docker..."
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    echo "Enabling Docker..."
    sudo systemctl enable docker
    sudo systemctl start docker

    echo "Adding user to docker group..."
    sudo usermod -aG docker ubuntu
    
}

deploy_project(){
    echo "Deploying project securely as 'ubuntu' user..."
    
    # INDUSTRY STANDARD QUICK FIX: Force a fresh login shell for the ubuntu user

    cd /home/ubuntu

    if [ -d "Food-Dash-Monorepo-Microservices" ]; then
        echo "Repo exists → pulling latest changes"
        cd Food-Dash-Monorepo-Microservices
        git pull
    else
        git clone https://github.com/Parth2496Singh/Food-Dash-Monorepo-Microservices.git
        cd Food-Dash-Monorepo-Microservices
    fi

    sudo chown -R ubuntu:ubuntu /home/ubuntu/Food-Dash-Monorepo-Microservices

    echo "Starting containers..."
    sudo sg docker -c "docker compose up -d"
}


# Run the execution
install_docker
deploy_project

# Force SSH to cycle so your terminal session immediately recognizes the group change
sudo systemctl restart ssh