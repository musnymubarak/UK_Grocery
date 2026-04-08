pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        SSH_KEY = '/var/jenkins_home/.ssh/id_rsa'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checking out latest code from GitHub...'
                sshagent (credentials: ['github-ssh']) {
                    sh '''
                        git fetch origin
                        git reset --hard origin/main
                    '''
                }
            }
        }

        stage('Copy .env file') {
            steps {
                echo 'Copying .env from server...'
                sh 'cp /etc/pos/.env ${WORKSPACE}/.env'
            }
        }

        stage('Build Backend and Frontend') {
            steps {
                echo 'Building backend and frontend only...'
                sh '''
                    cd ${WORKSPACE}
                    docker-compose -p pos -f docker-compose.yml -f docker-compose.prod.yml build backend frontend
                    docker-compose -p pos -f docker-compose.yml -f docker-compose.prod.yml up -d -V --no-deps --build --wait backend frontend
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed! Fetching logs...'
            sh '''
                cd ${WORKSPACE}
                docker-compose -p pos -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 frontend
                docker-compose -p pos -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 backend
            '''
        }
    }
}