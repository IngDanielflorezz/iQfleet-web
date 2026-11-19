namespace IQFleet.Api.Common;

/// <summary>
/// Carga api/.env al ejecutar con "dotnet run" (en Docker ya lo carga env_file).
/// Solo define las variables que no existan: lo que venga del entorno real
/// (Docker, terminal, CI) siempre tiene prioridad sobre el archivo.
/// </summary>
public static class DotEnv
{
    public static void CargarSiExiste()
    {
        var ruta = Buscar(Directory.GetCurrentDirectory());
        if (ruta is null) return;

        foreach (var linea in File.ReadAllLines(ruta))
        {
            var texto = linea.Trim();
            if (texto.Length == 0 || texto.StartsWith('#')) continue;

            var partes = texto.Split('=', 2);
            if (partes.Length != 2) continue;

            var clave = partes[0].Trim();
            var valor = partes[1].Trim().Trim('\'', '"');
            if (clave.Length > 0 && Environment.GetEnvironmentVariable(clave) is null)
                Environment.SetEnvironmentVariable(clave, valor);
        }
    }

    /// <summary>Busca .env en el directorio actual y hasta tres niveles arriba (api/src/IQFleet.Api → api/).</summary>
    private static string? Buscar(string desde)
    {
        var dir = new DirectoryInfo(desde);
        for (var i = 0; i < 4 && dir is not null; i++, dir = dir.Parent)
        {
            var ruta = Path.Combine(dir.FullName, ".env");
            if (File.Exists(ruta)) return ruta;
        }
        return null;
    }
}
