pipeline {
  agent { label 'pawroutine-course' }
  options { timestamps(); disableConcurrentBuilds(); timeout(time: 60, unit: 'MINUTES') }
  triggers { pollSCM('H/5 * * * *') }
  parameters {
    string(name: 'REGISTRY_HOST', defaultValue: '127.0.0.1:5000', description: 'Local Course registry or an authenticated external registry')
    string(name: 'IMAGE_REPOSITORY', defaultValue: 'pawroutine', description: 'Registry repository, e.g. team/pawroutine')
    string(name: 'REGISTRY_CREDENTIALS_ID', defaultValue: '', description: 'Jenkins username/password credential ID; required outside loopback registry')
    booleanParam(name: 'PUBLISH_AND_DEPLOY', defaultValue: true, description: 'Publish and deploy to the isolated Course project after verification')
  }
  environment {
    DELIVERY_PROJECT = 'pawroutine-course-delivery'
    // Inside Course only: the outer container limits access to host loopback.
    DELIVERY_BIND_ADDRESS = '0.0.0.0'
  }
  stages {
    stage('Source and configuration') {
      steps {
        script {
          if (!(params.REGISTRY_HOST ==~ /[a-zA-Z0-9.-]+(:[0-9]+)?/) || !(params.IMAGE_REPOSITORY ==~ /[a-z0-9][a-z0-9._\/-]*/)) {
            error('Invalid registry host or repository')
          }
          if (!(params.REGISTRY_HOST in ['127.0.0.1:5000', 'localhost:5000']) && !params.REGISTRY_CREDENTIALS_ID?.trim()) {
            error('External registry requires a Jenkins credential ID')
          }
          env.DELIVERY_REVISION = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
          env.DELIVERY_IMAGE = "${params.REGISTRY_HOST}/${params.IMAGE_REPOSITORY}:${env.DELIVERY_REVISION}"
          env.REGISTRY_HOST = params.REGISTRY_HOST
        }
        sh 'bash scripts/delivery.sh init'
      }
    }
    stage('Dependency audit, unit, API, production build and E2E') {
      steps { sh 'bash scripts/delivery.sh verify' }
    }
    stage('Build release image') {
      steps { sh 'bash scripts/delivery.sh build' }
    }
    stage('Publish image') {
      when { expression { params.PUBLISH_AND_DEPLOY } }
      steps {
        script {
          if (params.REGISTRY_CREDENTIALS_ID?.trim()) {
            withCredentials([usernamePassword(credentialsId: params.REGISTRY_CREDENTIALS_ID, usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASSWORD')]) {
              sh '''
                set +x
                export DOCKER_CONFIG="$WORKSPACE/.docker-auth"
                mkdir -p "$DOCKER_CONFIG"
                trap 'docker logout "$REGISTRY_HOST" >/dev/null 2>&1 || true; rm -f "$DOCKER_CONFIG/config.json"' EXIT
                printf '%s' "$REGISTRY_PASSWORD" | docker login "$REGISTRY_HOST" --username "$REGISTRY_USER" --password-stdin
                docker push "$DELIVERY_IMAGE"
                docker pull "$DELIVERY_IMAGE"
              '''
            }
          } else {
            sh 'docker push "$DELIVERY_IMAGE" && docker pull "$DELIVERY_IMAGE"'
          }
        }
      }
    }
    stage('Deploy and verify') {
      when { expression { params.PUBLISH_AND_DEPLOY } }
      steps {
        sh 'bash scripts/delivery.sh deploy'
        sh 'bash scripts/delivery.sh backup'
        sh 'bash scripts/delivery.sh recovery-check'
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'artifacts/verification/**,artifacts/revision.txt,artifacts/image-id.txt,artifacts/smoke.json,artifacts/recovery.txt', allowEmptyArchive: true
    }
    failure { echo 'Delivery stopped. Inspect verification logs; failed checks block later deployment stages.' }
  }
}
