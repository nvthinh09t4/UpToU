# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /repo

# Restore — copy csproj files first so Docker layer-caches the restore step
COPY src/UpToU.Core/UpToU.Core.csproj                       src/UpToU.Core/
COPY src/UpToU.Infrastructure/UpToU.Infrastructure.csproj   src/UpToU.Infrastructure/
COPY src/UpToU.API/UpToU.API.csproj                         src/UpToU.API/
RUN dotnet restore src/UpToU.API/UpToU.API.csproj

# Copy source and publish
COPY src/ src/
RUN dotnet publish src/UpToU.API/UpToU.API.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# ASP.NET Core listens on 8080 inside the container (no HTTPS termination here —
# Nginx handles TLS at the edge)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "UpToU.API.dll"]
