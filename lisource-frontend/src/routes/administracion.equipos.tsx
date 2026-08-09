import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ErrorState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { useCategories, useEquipmentList, useLocations } from "@/features/equipment/use-equipment";
import { ApiError } from "@/lib/api-error";
import { equipmentService } from "@/services";
import type { EquipmentDto, EquipmentInput, OperationalStatusCode } from "@/types";

export const Route = createFileRoute("/administracion/equipos")({
  head: () => ({
    meta: [
      { title: "Administración de equipos · LISource" },
      {
        name: "description",
        content:
          "Registra, edita y actualiza el estado operativo de los equipos del Laboratorio Integrado de Sistemas.",
      },
      { property: "og:title", content: "Administración de equipos · LISource" },
      {
        property: "og:description",
        content: "Gestión del inventario tecnológico del LIS para administradores.",
      },
    ],
  }),
  component: AdminEquipmentPage,
});

const statuses: OperationalStatusCode[] = [
  "OPERATIVO",
  "MANTENIMIENTO",
  "FUERA_SERVICIO",
  "RETIRADO",
];

interface FormState {
  inventoryCode: string;
  name: string;
  description: string;
  serialNumber: string;
  macAddress: string;
  categoryId: string;
  locationId: string;
  operationalStatus: OperationalStatusCode;
}

const blankForm: FormState = {
  inventoryCode: "",
  name: "",
  description: "",
  serialNumber: "",
  macAddress: "",
  categoryId: "",
  locationId: "",
  operationalStatus: "OPERATIVO",
};

function AdminEquipmentPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const categories = useCategories();
  const locations = useLocations();
  const list = useEquipmentList({ pageSize: 50 });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentDto | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "ADMIN") void navigate({ to: "/" });
  }, [user, navigate]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["equipment"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (input: EquipmentInput) => {
      const saved = editing
        ? await equipmentService.update(editing.id, input)
        : await equipmentService.create(input);
      if (!imageFile) return saved;
      try {
        return await equipmentService.uploadImage(saved.id, imageFile);
      } catch (cause) {
        throw new ImageUploadAfterSaveError(saved, cause);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? t("admin.updated") : t("admin.created"));
      setOpen(false);
    },
    onError: (error) => {
      if (error instanceof ImageUploadAfterSaveError) {
        setEditing(error.equipment);
        invalidate();
        toast.error(t("admin.imageSavedDataOnly"));
        return;
      }
      toast.error(t(error instanceof ApiError ? error.messageKey : "errors.unknown"));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: OperationalStatusCode }) =>
      equipmentService.changeStatus(input.id, input.status),
    onSuccess: () => {
      invalidate();
      toast.success(t("admin.statusChanged"));
    },
    onError: (error) => {
      toast.error(t(error instanceof ApiError ? error.messageKey : "errors.unknown"));
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...blankForm, categoryId: String(categories.data?.[0]?.id ?? "") });
    setErrors({});
    setImageFile(null);
    setImagePreview(null);
    setOpen(true);
  };

  const openEdit = (item: EquipmentDto) => {
    setEditing(item);
    setForm({
      inventoryCode: item.inventoryCode,
      name: item.name,
      description: item.description ?? "",
      serialNumber: item.serialNumber ?? "",
      macAddress: item.macAddress ?? "",
      categoryId: String(item.category.id),
      locationId: item.location ? String(item.location.id) : "",
      operationalStatus: item.operationalStatus.code,
    });
    setErrors({});
    setImageFile(null);
    setImagePreview(item.imageUrl);
    setOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.inventoryCode.trim()) next.inventoryCode = t("admin.validation.codeRequired");
    if (!form.name.trim()) next.name = t("admin.validation.nameRequired");
    if (!form.categoryId) next.categoryId = t("admin.validation.nameRequired");
    if (!form.serialNumber.trim() && !form.macAddress.trim())
      next.serialNumber = t("admin.validation.identifier");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    saveMutation.mutate({
      inventoryCode: form.inventoryCode.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      serialNumber: form.serialNumber.trim() || undefined,
      macAddress: form.macAddress.trim() || undefined,
      categoryId: Number(form.categoryId),
      locationId: form.locationId ? Number(form.locationId) : null,
      operationalStatus: form.operationalStatus,
    });
  };

  return (
    <AppShell title={t("admin.title")}>
      <PageHeader
        title={t("admin.title")}
        subtitle={t("admin.subtitle")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("admin.new")}
          </Button>
        }
      />

      {list.isError ? (
        <div className="surface-card">
          <ErrorState
            title={t("states.errorTitle")}
            description={t("states.errorText")}
            actionLabel={t("common.retry")}
            onRetry={() => void list.refetch()}
          />
        </div>
      ) : list.isLoading || !list.data ? (
        <div className="surface-card space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
                  {t("equipment.name")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
                  {t("equipment.category")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
                  {t("equipment.status")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
                  {t("admin.changeStatus")}
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium text-muted-foreground">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.inventoryCode}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{item.category.name}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={item.visualStatus} />
                  </td>
                  <td className="px-5 py-3">
                    <Select
                      value={item.operationalStatus.code}
                      onValueChange={(value) =>
                        statusMutation.mutate({
                          id: item.id,
                          status: value as OperationalStatusCode,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-[190px]"
                        aria-label={`${t("admin.changeStatus")} ${item.name}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`equipment.operational.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      {t("common.edit")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={submit} noValidate className="space-y-5">
            <DialogHeader>
              <DialogTitle>{editing ? t("admin.editTitle") : t("admin.newTitle")}</DialogTitle>
              <DialogDescription>{t("admin.subtitle")}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="inventoryCode">{t("equipment.code")}</Label>
                <Input
                  id="inventoryCode"
                  value={form.inventoryCode}
                  onChange={(event) => setForm({ ...form, inventoryCode: event.target.value })}
                  aria-invalid={Boolean(errors.inventoryCode)}
                />
                {errors.inventoryCode ? (
                  <p className="text-xs text-danger">{errors.inventoryCode}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("equipment.name")}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name ? <p className="text-xs text-danger">{errors.name}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="serialNumber">{t("equipment.serialNumber")}</Label>
                <Input
                  id="serialNumber"
                  value={form.serialNumber}
                  onChange={(event) => setForm({ ...form, serialNumber: event.target.value })}
                  aria-invalid={Boolean(errors.serialNumber)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="macAddress">{t("equipment.macAddress")}</Label>
                <Input
                  id="macAddress"
                  value={form.macAddress}
                  onChange={(event) => setForm({ ...form, macAddress: event.target.value })}
                />
              </div>
            </div>
            {errors.serialNumber ? (
              <p className="text-xs text-danger">{errors.serialNumber}</p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category">{t("equipment.category")}</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => setForm({ ...form, categoryId: value })}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories.data ?? []).map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId ? (
                  <p className="text-xs text-danger">{errors.categoryId}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">{t("equipment.location")}</Label>
                <Select
                  value={form.locationId}
                  onValueChange={(value) => setForm({ ...form, locationId: value })}
                >
                  <SelectTrigger id="location" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(locations.data ?? []).map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operationalStatus">{t("equipment.operationalStatus")}</Label>
              <Select
                value={form.operationalStatus}
                onValueChange={(value) =>
                  setForm({ ...form, operationalStatus: value as OperationalStatusCode })
                }
              >
                <SelectTrigger id="operationalStatus" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`equipment.operational.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                {t("equipment.description")}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({t("common.optional")})
                </span>
              </Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentImage">{t("equipment.image")}</Label>
              <Input
                id="equipmentImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (!file) return;
                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    toast.error(t("admin.invalidImageType"));
                    event.target.value = "";
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error(t("admin.imageTooLarge"));
                    event.target.value = "";
                    return;
                  }
                  if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
              />
              <p className="text-xs text-muted-foreground">{t("admin.imageHint")}</p>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={t("equipment.image")}
                  className="h-36 w-full rounded-lg border border-border object-cover"
                />
              ) : null}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

class ImageUploadAfterSaveError extends Error {
  constructor(
    public equipment: EquipmentDto,
    cause: unknown,
  ) {
    super("Equipment saved but image upload failed", { cause });
  }
}
