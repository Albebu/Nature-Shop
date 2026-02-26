-- Create isolated databases for each microservice
-- Executed automatically by PostgreSQL on first container init

CREATE DATABASE nature_shop_auth;
CREATE DATABASE nature_shop_orders;
CREATE DATABASE nature_shop_catalog;
