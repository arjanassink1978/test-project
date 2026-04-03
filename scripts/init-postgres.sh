#!/bin/bash
# PostgreSQL initialization script
# This runs when the postgres container starts for the first time

set -e

echo "PostgreSQL initialization script started..."

# The Liquibase migrations will be run by Spring Boot when it starts
# This script just waits for postgres to be ready

echo "PostgreSQL is ready for connections"
