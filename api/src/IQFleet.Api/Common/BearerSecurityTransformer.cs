using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace IQFleet.Api.Common;

/// <summary>
/// Declara el token Bearer en el documento OpenAPI para que Swagger UI y Scalar
/// muestren el botón "Authorize" y lo envíen en cada petición de prueba.
/// </summary>
public class BearerSecurityTransformer : IOpenApiDocumentTransformer
{
    public const string Scheme = "Bearer";

    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes[Scheme] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            Description = "Pega el valor de IQFLEET_API_TOKEN (api/.env), sin la palabra Bearer.",
        };

        document.Security ??= [];
        document.Security.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference(Scheme, document)] = [],
        });

        return Task.CompletedTask;
    }
}
