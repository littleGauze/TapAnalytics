import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.1.7'],
};

export default nextConfig;
