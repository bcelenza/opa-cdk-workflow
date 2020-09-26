#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { OpaWorkflowCdkStack } from '../lib/opa-workflow-cdk-stack';

const app = new cdk.App();
new OpaWorkflowCdkStack(app, 'OpaWorkflowCdkStack');
