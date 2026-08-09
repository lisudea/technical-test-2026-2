package co.edu.udea.lis.lisource.catalog.application;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.catalog.api.AdminCatalogDtos.CatalogAdminItem;
import co.edu.udea.lis.lisource.catalog.api.AdminCatalogDtos.CatalogInput;
import co.edu.udea.lis.lisource.catalog.infrastructure.AdminCatalogRepository;
import co.edu.udea.lis.lisource.catalog.infrastructure.AdminCatalogRepository.Type;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCatalogService {
    private final AdminCatalogRepository repository;
    private final AuditPublisher audit;
    public AdminCatalogService(AdminCatalogRepository repository, AuditPublisher audit) { this.repository=repository; this.audit=audit; }
    public List<CatalogAdminItem> list(Type type) { return repository.list(type); }

    @Transactional
    public CatalogAdminItem create(Type type, CatalogInput input, long actorId) {
        var normalized = normalize(input);
        ensureUnique(type, 0, normalized);
        int id = repository.insert(type, normalized.code(), normalized.name(), normalized.description());
        var result = required(type,id);
        audit.success(type.createEvent, actorId, (long)id, type + " created", null, result);
        return result;
    }

    @Transactional
    public CatalogAdminItem update(Type type, int id, CatalogInput input, long actorId) {
        var before = required(type,id);
        var normalized = normalize(input);
        ensureUnique(type,id,normalized);
        repository.update(type,id,normalized.code(),normalized.name(),normalized.description());
        var after=required(type,id);
        audit.success(type.updateEvent,actorId,(long)id,type+" updated",before,after);
        return after;
    }

    @Transactional
    public CatalogAdminItem status(Type type,int id,String requested,long actorId) {
        var before=required(type,id);
        String status=requested.toUpperCase(Locale.ROOT);
        if (!status.equals("ACTIVO") && !status.equals("INACTIVO")) throw validation("Unknown record status.");
        repository.changeStatus(type,id,status);
        var after=required(type,id);
        audit.success(type.updateEvent,actorId,(long)id,type+" status changed",before,after);
        return after;
    }

    private CatalogInput normalize(CatalogInput input) {
        String code=input.code().trim().toUpperCase(Locale.ROOT);
        String name=input.name().trim();
        String description=input.description()==null || input.description().isBlank()?null:input.description().trim();
        return new CatalogInput(code,name,description);
    }
    private void ensureUnique(Type type,int id,CatalogInput input) {
        if(repository.conflicts(type,id,input.code(),input.name())) throw new AppException(HttpStatus.CONFLICT,
                ErrorCode.RESOURCE_CONFLICT,"Another catalog item already uses that code or name.");
    }
    private CatalogAdminItem required(Type type,int id) { return repository.find(type,id).orElseThrow(() ->
            new AppException(HttpStatus.NOT_FOUND,ErrorCode.RESOURCE_NOT_FOUND,"Catalog item was not found.")); }
    private AppException validation(String detail) { return new AppException(HttpStatus.UNPROCESSABLE_ENTITY,ErrorCode.VALIDATION_ERROR,detail); }
}
