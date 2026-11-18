# OpenShift-ready non-root Nginx container for EstateSphere
FROM nginxinc/nginx-unprivileged:1.27-alpine

USER root

# Copy custom OpenShift-compatible Nginx configuration (port 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean default web root and copy EstateSphere flat project files
RUN rm -rf /usr/share/nginx/html/*
COPY *.html *.css *.js /usr/share/nginx/html/

# Ensure arbitrary OpenShift UIDs (root group 0) can read assets and write nginx temp/cache/pid
RUN chmod -R a+rX /usr/share/nginx/html \
    && chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d \
    && chmod -R g=u /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d

# Run as non-root (OpenShift overrides UID at runtime)
USER 101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
