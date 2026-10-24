using Npgsql;

namespace IQFleet.Api.Common;

public static class DatabaseUrl
{
    /// <summary>
    /// Convierte IQFLEET_DATABASE_URL (postgresql://usuario:clave@host:puerto/base) en una
    /// cadena de conexión de Npgsql. Si ya viene en formato "Host=...;" se usa tal cual.
    /// </summary>
    public static string ToConnectionString(string url, int? maxPoolSize)
    {
        NpgsqlConnectionStringBuilder builder;

        if (url.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            url.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            var uri = new Uri(url);
            var credenciales = uri.UserInfo.Split(':', 2);
            builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
                Database = uri.AbsolutePath.Trim('/') is { Length: > 0 } db ? Uri.UnescapeDataString(db) : "postgres",
                Username = Uri.UnescapeDataString(credenciales[0]),
                Password = credenciales.Length > 1 ? Uri.UnescapeDataString(credenciales[1]) : null,
            };

            // Supabase (pooler) exige SSL; un Postgres local de Docker no lo usa.
            if (uri.Host.EndsWith(".supabase.com", StringComparison.OrdinalIgnoreCase) ||
                uri.Host.EndsWith(".supabase.co", StringComparison.OrdinalIgnoreCase))
            {
                builder.SslMode = SslMode.Require;
            }
        }
        else
        {
            builder = new NpgsqlConnectionStringBuilder(url);
        }

        if (maxPoolSize is > 0) builder.MaxPoolSize = maxPoolSize.Value;
        return builder.ConnectionString;
    }
}
