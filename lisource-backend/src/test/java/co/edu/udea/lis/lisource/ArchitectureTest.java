package co.edu.udea.lis.lisource;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;

class ArchitectureTest {
    @Test
    void domainDoesNotDependOnApiOrSpringWeb() {
        var classes = new ClassFileImporter().importPackages("co.edu.udea.lis.lisource");
        noClasses().that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAnyPackage("..api..", "org.springframework.web..")
                .check(classes);
    }

    @Test
    void controllersDoNotDependOnInfrastructure() {
        var classes = new ClassFileImporter().importPackages("co.edu.udea.lis.lisource");
        noClasses().that().resideInAPackage("..api..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure.entity..")
                .check(classes);
    }
}
