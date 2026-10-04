# Rocky Linux 10 為基底的 Dev Container
FROM quay.io/rockylinux/rockylinux:10

# ---- 基礎工具 ----
RUN dnf -y update && \
    dnf -y install \
        git sudo which procps-ng iproute nftables \
        ca-certificates tar gzip xz findutils \
        bash-completion vim-minimal && \
    dnf clean all && rm -rf /var/cache/dnf

# ---- Node.js v24（NodeSource）----
RUN curl -fsSL https://rpm.nodesource.com/setup_24.x | bash - && \
    dnf install -y nodejs && \
    dnf clean all && rm -rf /var/cache/dnf

# ---- 全域 CLI：用 npm 安裝，避免 pnpm 全域路徑與 postinstall 問題 ----
RUN npm install -g pnpm @anthropic-ai/claude-code @google/gemini-cli

# ---- 非 root 使用者 ----
ARG USERNAME=dev
ARG USER_UID=1000
ARG USER_GID=1000
RUN groupadd --gid ${USER_GID} ${USERNAME} && \
    useradd --uid ${USER_UID} --gid ${USER_GID} -m -s /bin/bash ${USERNAME} && \
    echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USERNAME} && \
    chmod 0440 /etc/sudoers.d/${USERNAME} && \
    mkdir -p /home/${USERNAME}/.claude /home/${USERNAME}/.gemini && \
    chown -R ${USERNAME}:${USERNAME} /home/${USERNAME}

USER ${USERNAME}
WORKDIR /workspaces