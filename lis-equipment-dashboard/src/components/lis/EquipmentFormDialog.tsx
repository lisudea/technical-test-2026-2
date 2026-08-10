import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, createEquipment, updateEquipment, type Equipment } from "@/lib/lis-api";

const CATEGORIES = [
  "MICROCONTROLADORES", "VR", "REDES", "ROBOTICA",
  "IMPRESION_3D", "COMPUTO", "AUDIO_VIDEO", "SENSORES_IOT", "HERRAMIENTAS",
];

const BACKEND_STATUSES = ["DISPONIBLE", "EN_MANTENIMIENTO", "DADO_DE_BAJA"] as const;

export function EquipmentFormDialog({
  equipment,
  open,
  onOpenChange,
  onSuccess,
}: {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const isEdit = Boolean(equipment);

  const [name, setName] = useState("");
  const [macSerialNumber, setMacSerialNumber] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (open) {
      setName(equipment?.name ?? "");
      setMacSerialNumber(equipment?.serial ?? "");
      setCategory(equipment?.category ?? "");
      setStatus("");
    }
  }, [open, equipment]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && equipment) {
        await updateEquipment(equipment.id, { name, category, status });
      } else {
        await createEquipment({ name, macSerialNumber, category, status });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? t("equipmentForm.updateSuccess") : t("equipmentForm.createSuccess"));
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(t(error.messageKey), { description: error.detail });
      } else {
        toast.error(t("error.server"));
      }
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !category || !status || (!isEdit && !macSerialNumber)) {
      toast.error(t("equipmentForm.errorFields"));
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass rounded-3xl border-border/70 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("equipmentForm.editTitle") : t("equipmentForm.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("equipmentForm.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eq-name">{t("equipmentForm.name")}</Label>
            <Input
              id="eq-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-secondary/40"
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="eq-serial">{t("equipmentForm.serial")}</Label>
              <Input
                id="eq-serial"
                value={macSerialNumber}
                onChange={(e) => setMacSerialNumber(e.target.value)}
                className="rounded-xl bg-secondary/40"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("equipmentForm.category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl bg-secondary/40">
                <SelectValue placeholder={t("equipmentForm.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("equipmentForm.status")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl bg-secondary/40">
                <SelectValue placeholder={t("equipmentForm.statusPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {BACKEND_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`equipmentForm.statusOptions.${s}` as const)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
              {t("reserve.cancel")}
            </Button>
            <Button type="submit" className="rounded-full" disabled={mutation.isPending}>
              {mutation.isPending ? t("equipmentForm.saving") : t("equipmentForm.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}