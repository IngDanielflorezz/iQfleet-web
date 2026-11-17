using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // Validación simulada de credenciales (aquí conectarás tu base de datos con EF Core posteriormente)
        if (request.Usuario == "admin" && request.Password == "admin123")
        {
            var jwtSecret = Environment.GetEnvironmentVariable("IQFLEET_JWT_SECRET") 
                ?? "clave_secreta_super_robusta_para_iqfleet_2026_jwt_hmac";

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(jwtSecret);
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, "1"),
                    new Claim(ClaimTypes.Name, "Administrador iQFleet"),
                    new Claim("rol", "ADMINISTRADOR"),
                    new Claim("empresa", "iQFleet S.A.S.")
                }),
                Expires = DateTime.UtcNow.AddMinutes(480),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // Inyectar la Cookie HttpOnly de alta seguridad
            Response.Cookies.Append("iqfleet_session", tokenString, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Ponlo en false si pruebas temporalmente en HTTP local sin certificado
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(480)
            });

            return Ok(new
            {
                success = true,
                token = tokenString,
                usuario = new { id = 1, nombres = "Administrador", rol = "ADMINISTRADOR", empresa = "iQFleet S.A.S." }
            });
        }

        return Unauthorized(new { success = false, message = "Credenciales inválidas" });
    }
}

public record LoginRequest(string Usuario, string Password);