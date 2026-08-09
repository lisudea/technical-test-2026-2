package co.edu.udea.lis.lisource.catalog.api;

import co.edu.udea.lis.lisource.catalog.infrastructure.CatalogRepository;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/catalogs")
public class CatalogController {
    private final CatalogRepository repository;

    public CatalogController(CatalogRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/categories")
    public List<CatalogDtos.CatalogItem> categories() { return repository.categories(); }

    @GetMapping("/locations")
    public List<CatalogDtos.CatalogItem> locations() { return repository.locations(); }

    @GetMapping("/equipment-statuses")
    public List<CatalogDtos.StatusItem> equipmentStatuses() { return repository.equipmentStatuses(); }

    @GetMapping("/languages")
    public List<CatalogDtos.LanguageItem> languages() { return repository.languages(); }
}
