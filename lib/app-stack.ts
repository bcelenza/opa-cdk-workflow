import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { Stack } from '@aws-cdk/core';

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const vpcCidr = "10.0.0.0/16";

    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      cidr: vpcCidr,
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
    const opaImage = new DockerImageAsset(this, 'OpaImage', {
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
    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: lb.loadBalancerDnsName
    });

    // API service task definition
    const loggingConfig = ecs.LogDrivers.awsLogs({streamPrefix: 'OpaWorkflow'});
    const frontendTaskDef = new ecs.FargateTaskDefinition(this, 'ApiServiceTaskDefinition')
    const envoyContainer = frontendTaskDef.addContainer('envoy', {
      image: ecs.ContainerImage.fromDockerImageAsset(envoyImage),
      memoryLimitMiB: 128,
      logging: loggingConfig,
    });
    // Expose HTTP port for load balancer
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
    // Expose HTTP service for envoy
    appContainer.addPortMappings({
      containerPort: 8080,
    });
    const opaContainer = frontendTaskDef.addContainer('opa', {
      image: ecs.ContainerImage.fromDockerImageAsset(opaImage),
      memoryLimitMiB: 64,
      logging: loggingConfig,
      environment: {
        AWS_REGION: Stack.of(this).region,
        POLICY_BUCKET: policyBucket.bucketRegionalDomainName,
        POLICY_BUNDLE: "policies/bundle.tar.gz",
      },
    });
    // Expose gRPC authZ service for envoy
    opaContainer.addPortMappings({
      containerPort: 9191,
    });

    // Security group for API service
    const apiServiceSecurityGroup = new ec2.SecurityGroup(this, 'ApiServiceSecurityGroup', {
      vpc: vpc,
    });
    apiServiceSecurityGroup.addIngressRule(ec2.Peer.ipv4(vpcCidr), ec2.Port.tcp(80), 'HTTP from within VPC');

    // API service
    const apiService = new ecs.FargateService(this, 'ApiService', {
      cluster: cluster,
      taskDefinition: frontendTaskDef,
      securityGroups: [apiServiceSecurityGroup],
    });

    // Grant frontend service access to the policy bucket
    policyBucket.grantRead(apiService.taskDefinition.taskRole);

    // Add frontend service tasks to load balancer
    lbListener.addTargets('ApiServiceTasks', {
      port: 80,
      targets: [apiService],
    })
  }
}
