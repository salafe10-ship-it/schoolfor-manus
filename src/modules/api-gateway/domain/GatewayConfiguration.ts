// src/modules/api-gateway/domain/GatewayConfiguration.ts
export interface RouteConfig {
  path: string;
  targetService: string;
  authRequired: boolean;
  rateLimit: number;
}

/**
 * API Gateway Configuration Management.
 * Defines routing and security rules for entry traffic.
 */
export interface GatewayConfiguration {
  routes: RouteConfig[];
  globalRateLimit: number;
}
