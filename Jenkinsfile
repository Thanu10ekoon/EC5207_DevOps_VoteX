pipeline {
    agent any
    
    triggers {
        pollSCM('H/5 * * * *')
    }
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_USERNAME = "${DOCKERHUB_CREDENTIALS_USR}"
        IMAGE_TAG = "${BUILD_NUMBER}"
        CLIENT_IMAGE = "${DOCKER_USERNAME}/votex-client"
        SERVER_IMAGE = "${DOCKER_USERNAME}/votex-server"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }
        
        stage('Build Client Image') {
            steps {
                echo 'Building client Docker image...'
                retry(3) {
                    dir('client') {
                        sh '''
                            docker build -t ${CLIENT_IMAGE}:${IMAGE_TAG} .
                            docker tag ${CLIENT_IMAGE}:${IMAGE_TAG} ${CLIENT_IMAGE}:latest
                        '''
                    }
                }
            }
        }
        
        stage('Build Server Image') {
            steps {
                echo 'Building server Docker image...'
                retry(3) {
                    dir('server') {
                        sh '''
                            docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} .
                            docker tag ${SERVER_IMAGE}:${IMAGE_TAG} ${SERVER_IMAGE}:latest
                        '''
                    }
                }
            }
        }
        
        stage('Push Images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                sh '''
                    echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin
                    
                    docker push ${CLIENT_IMAGE}:${IMAGE_TAG}
                    docker push ${CLIENT_IMAGE}:latest
                    
                    docker push ${SERVER_IMAGE}:${IMAGE_TAG}
                    docker push ${SERVER_IMAGE}:latest
                '''
            }
        }
        
        stage('Verify Images') {
            steps {
                echo 'Images pushed successfully!'
                sh '''
                    echo "Client Image: ${CLIENT_IMAGE}:${IMAGE_TAG}"
                    echo "Server Image: ${SERVER_IMAGE}:${IMAGE_TAG}"
                '''
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Docker images are available:"
            echo "  - ${CLIENT_IMAGE}:${IMAGE_TAG}"
            echo "  - ${SERVER_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo 'Pipeline failed! Check logs for details.'
        }
        cleanup {
            script {
                sh 'docker logout || true'
                sh 'docker image prune -f || true'
            }
        }
    }
}