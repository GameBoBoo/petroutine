import jenkins.model.Jenkins
import hudson.security.HudsonPrivateSecurityRealm
import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.GitSCM
import hudson.plugins.git.BranchSpec
import hudson.plugins.git.UserRemoteConfig

def instance = Jenkins.get()
def realm = new HudsonPrivateSecurityRealm(false)
def password = System.getenv('JENKINS_ADMIN_PASSWORD')
if (!password || password.length() < 20) throw new IllegalStateException('Set a private Jenkins admin password')
realm.createAccount('delivery-admin', password)
instance.setSecurityRealm(realm)
def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)
instance.setNumExecutors(1)
instance.setLabelString('pawroutine-course')
instance.save()
if (instance.getItem('PawRoutine-delivery') == null) {
  def job = instance.createProject(WorkflowJob, 'PawRoutine-delivery')
  def scm = new GitSCM([new UserRemoteConfig('/workspace/pawroutine-source', null, null, null)], [new BranchSpec('*/main')], false, [], null, null, [])
  def definition = new CpsScmFlowDefinition(scm, 'Jenkinsfile')
  definition.setLightweight(false)
  job.setDefinition(definition)
  job.save()
}
