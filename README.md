# Grand-challenge-runner

Provides a REST API to:
- submit docker swarm compatabile compose files and deploy them on a swarm. 
- Run Fault tolerance tests on deployed stacks
- Remove swarm stacks again

### Requirements: 
- already setup [docker swarm](https://docs.docker.com/engine/swarm/swarm-tutorial/create-swarm/)
- ssh access to all swarm nodes from the node this application runs on
- the application has to run on the leader swarm node since it uses docker cli to select containers to inject fault into and their hosts
- install and run node processs once with [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- Install [Pumba](https://github.com/alexei-led/pumba) on all swarm nodes:

    ```sh
    sudo curl -L https://github.com/alexei-led/pumba/releases/download/0.9.0/pumba_linux_amd64 -o /usr/bin/pumba
    ```
    ```sh
    sudo chmod +x /usr/bin/pumba
    ```