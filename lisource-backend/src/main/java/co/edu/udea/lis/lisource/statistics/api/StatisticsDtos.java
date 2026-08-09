package co.edu.udea.lis.lisource.statistics.api;

public final class StatisticsDtos {
    private StatisticsDtos() {}
    public record TopEquipment(int position, long equipmentId, String inventoryCode, String name,
                               String category, long totalReservations, long reservations) {}
    public record DashboardSummary(long total, long available, long reserved, long maintenance,
                                   long outOfService, long retired) {}
}

