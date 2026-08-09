package co.edu.udea.lis.lisource.catalog.api;

import co.edu.udea.lis.lisource.catalog.api.AdminCatalogDtos.*;
import co.edu.udea.lis.lisource.catalog.application.AdminCatalogService;
import co.edu.udea.lis.lisource.catalog.infrastructure.AdminCatalogRepository.Type;
import co.edu.udea.lis.lisource.shared.security.SecurityPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminCatalogController {
    private final AdminCatalogService service;
    public AdminCatalogController(AdminCatalogService service) { this.service=service; }

    @GetMapping("/categories") public List<CatalogAdminItem> categories(){return service.list(Type.CATEGORY);}
    @PostMapping("/categories") @ResponseStatus(HttpStatus.CREATED)
    public CatalogAdminItem createCategory(@Valid @RequestBody CatalogInput input){return service.create(Type.CATEGORY,input,SecurityPrincipal.userId());}
    @PutMapping("/categories/{id}") public CatalogAdminItem updateCategory(@PathVariable int id,@Valid @RequestBody CatalogInput input){return service.update(Type.CATEGORY,id,input,SecurityPrincipal.userId());}
    @PatchMapping("/categories/{id}/status") public CatalogAdminItem categoryStatus(@PathVariable int id,@Valid @RequestBody StatusChange input){return service.status(Type.CATEGORY,id,input.status(),SecurityPrincipal.userId());}

    @GetMapping("/locations") public List<CatalogAdminItem> locations(){return service.list(Type.LOCATION);}
    @PostMapping("/locations") @ResponseStatus(HttpStatus.CREATED)
    public CatalogAdminItem createLocation(@Valid @RequestBody CatalogInput input){return service.create(Type.LOCATION,input,SecurityPrincipal.userId());}
    @PutMapping("/locations/{id}") public CatalogAdminItem updateLocation(@PathVariable int id,@Valid @RequestBody CatalogInput input){return service.update(Type.LOCATION,id,input,SecurityPrincipal.userId());}
    @PatchMapping("/locations/{id}/status") public CatalogAdminItem locationStatus(@PathVariable int id,@Valid @RequestBody StatusChange input){return service.status(Type.LOCATION,id,input.status(),SecurityPrincipal.userId());}
}
