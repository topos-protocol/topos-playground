import { utils } from 'ethers'
import { Question, QuestionSet, ValidateFor } from 'nest-commander'

export interface SecretAnswers {
  privateKey: string
  tokenDeployerSalt: string
  toposCoreSalt: string
  toposCoreProxySalt: string
  toposMessagingSalt: string
  subnetRegistratorSalt: string
  auth0ClientId: string
  auth0ClientSecret: string
}

@QuestionSet({ name: 'secrets-questions' })
export class SecretQuestions {
  @Question({
    message:
      'Please provide the private key of the account which will pay fees',
    name: 'privateKey',
  })
  parsePrivateKey(val: string) {
    return val
  }

  @ValidateFor({ name: 'privateKey' })
  verifyPrivateKey(val: string) {
    const isValid = utils.isHexString(val, 32)

    if (!isValid) {
      return 'Please provide a valid 32-byte 0x-prefixed hex string!'
    }

    return true
  }

  @Question({
    message:
      'Please provide the salt of the deployment of the TokenDeployer contract',
    name: 'tokenDeployerSalt',
  })
  parseTokenDeployerSalt(val: string) {
    return val
  }

  @Question({
    message:
      'Please provide the salt of the deployment of the ToposCore contract',
    name: 'toposCoreSalt',
  })
  parseToposCoreSalt(val: string) {
    return val
  }

  @Question({
    message:
      'Please provide the salt of the deployment of the ToposCoreProxy contract',
    name: 'toposCoreProxySalt',
  })
  parseToposCoreProxySalt(val: string) {
    return val
  }

  @Question({
    message:
      'Please provide the salt of the deployment of the ToposMessaging contract',
    name: 'toposMessagingSalt',
  })
  parseToposMessagingSalt(val: string) {
    return val
  }

  @Question({
    message:
      'Please provide the salt of the deployment of the SubnetRegistrator contract',
    name: 'subnetRegistratorSalt',
  })
  parseSubnetRegistratorSalt(val: string) {
    return val
  }

  @Question({
    message: 'Please provide the client id for Auth0',
    name: 'auth0ClientId',
  })
  parseAuth0ClientId(val: string) {
    return val
  }

  @Question({
    message: 'Please provide the client secret for Auth0',
    name: 'auth0ClientSecret',
  })
  parseAuth0ClientSecret(val: string) {
    return val
  }

  @ValidateFor({ name: 'tokenDeployerSalt' })
  @ValidateFor({ name: 'toposCoreSalt' })
  @ValidateFor({ name: 'toposCoreProxySalt' })
  @ValidateFor({ name: 'toposMessagingSalt' })
  @ValidateFor({ name: 'subnetRegistratorSalt' })
  @ValidateFor({ name: 'auth0ClientId' })
  @ValidateFor({ name: 'auth0ClientSecret' })
  verifySalt(val: string) {
    return Boolean(val)
  }
}
