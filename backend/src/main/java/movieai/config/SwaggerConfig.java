
package movieai.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Movie Recommendation AI Backend API")
                        .version("1.0")
                        .description("REST API Documentation for Intelligent Movie Recommendation System")
                        .contact(new Contact()
                                .name("Horizon Campus - Member 2")
                                .email("backend@horizon.ac.lk")));
    }
}