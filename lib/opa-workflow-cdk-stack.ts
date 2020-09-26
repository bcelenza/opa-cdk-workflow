import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';

export class OpaWorkflowCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      cidr: "10.0.0.0/16",
    });

    // ECS cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
    });

    // S3 bucket for policy bundles
    const policyBucket = new s3.Bucket(this, 'PolicyBucket');
    // deploy policies into the bucket
    const policyBundle = s3deploy.Source.asset('./opa.out');
    new s3deploy.BucketDeployment(this, 'DeployPolicies', {
      sources: [policyBundle],
      destinationBucket: policyBucket,
      destinationKeyPrefix: 'policies',
    });

    // OPA and Envoy images
    const opaImage = new DockerImageAsset(this, 'OPAImage', {
      directory: './images/opa',
    });
    const envoyImage = new DockerImageAsset(this, 'EnvoyImage', {
      directory: './images/envoy',
    });


    // Load balancer
    const lb = new elb.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true,
    });
    const lbListener = lb.addListener('LoadBalancerListener', {
      port: 80
    });

    // Frontend service task definition
    const loggingConfig = ecs.LogDrivers.awsLogs({streamPrefix: 'OpaWorkflow'});
    const frontendTaskDef = new ecs.FargateTaskDefinition(this, 'FrontendServiceTaskDefinition')
    const envoyContainer = frontendTaskDef.addContainer('envoy', {
      image: ecs.ContainerImage.fromDockerImageAsset(envoyImage),
      memoryLimitMiB: 128,
      logging: loggingConfig,
    });
    envoyContainer.addPortMappings({
      containerPort: 80,
    });
    const appContainer = frontendTaskDef.addContainer('app', {
      image: ecs.ContainerImage.fromRegistry('bcelenza/mockingbird'),
      memoryLimitMiB: 64,
      environment: {
        HTTP_PORT: "8080"
      },
      logging: loggingConfig,
    });
    appContainer.addPortMappings({
      containerPort: 8080,
    });
    const opaContainer = frontendTaskDef.addContainer('opa', {
      image: ecs.ContainerImage.fromDockerImageAsset(opaImage),
      memoryLimitMiB: 64,
      logging: loggingConfig,
      environment: {
        AWS_REGION: "us-west-1",
        POLICY_BUCKET: "https://" + policyBucket.bucketRegionalDomainName,
        POLICY_BUNDLE: "policies/bundle.tar.gz",
      },
    });
    opaContainer.addPortMappings({
      containerPort: 9191,
    });

    // Frontend service
    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      cluster: cluster,
      taskDefinition: frontendTaskDef,
    });

    // Grant frontend service access to the policy bucket
    policyBucket.grantRead(frontendService.taskDefinition.taskRole);

    // Add frontend service tasks to load balancer
    lbListener.addTargets('FrontendTasks', {
      port: 80,
      targets: [frontendService],
    })
  }
}
