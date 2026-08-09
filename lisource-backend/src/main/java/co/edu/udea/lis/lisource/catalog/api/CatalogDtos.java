package co.edu.udea.lis.lisource.catalog.api;

public final class CatalogDtos {
    private CatalogDtos() {}
    public record CatalogItem(int id, String code, String name) {}
    public record StatusItem(String code, String name) {}
    public record LanguageItem(int id, String code, String name, String nativeName) {}
}

