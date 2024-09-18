import { Button } from "@renderer/components/ui/button"
import { useAuthQuery } from "@renderer/hooks/common"
import { apiClient } from "@renderer/lib/api-fetch"
import { toastFetchError } from "@renderer/lib/error-parser"
import type {
  ActionEntryField,
  ActionFeedField,
  ActionOperation,
  ActionsResponse,
} from "@renderer/models"
import { ActionCard } from "@renderer/modules/settings/action-card"
import { SettingsTitle } from "@renderer/modules/settings/title"
import { defineSettingPageData } from "@renderer/modules/settings/utils"
import { Queries } from "@renderer/queries"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

const iconName = "i-mgc-magic-2-cute-re"
const priority = 1020

export const loader = defineSettingPageData({
  iconName,
  name: "titles.actions",
  priority,
})

type ActionsInput = {
  name: string
  condition: {
    field?: ActionFeedField
    operator?: ActionOperation
    value?: string
  }[]
  result: {
    translation?: string
    summary?: boolean
    rewriteRules?: {
      from: string
      to: string
    }[]
    blockRules?: {
      field?: ActionEntryField
      operator?: ActionOperation
      value?: string | number
    }[]
  }
}[]

export function Component() {
  const { t } = useTranslation("settings")
  const actions = useAuthQuery(Queries.action.getAll())
  const [actionsData, setActionsData] = useState<ActionsInput>([])

  useEffect(() => {
    if (actions.data?.rules) {
      setActionsData(actions.data.rules)
    }
  }, [actions.data?.rules])

  const mutation = useMutation({
    mutationFn: async () => {
      actionsData.forEach((action) => {
        action.condition = action.condition.filter((c) => c.field && c.operator && c.value)
        action.result.rewriteRules = action.result.rewriteRules?.filter((r) => r.from && r.to)
        action.result.blockRules = action.result.blockRules?.filter(
          (r) => r.field && r.operator && r.value,
        )
      })
      await apiClient.actions.$put({
        json: {
          rules: actionsData as ActionsResponse,
        },
      })
    },
    onSuccess: () => {
      Queries.action.getAll().invalidate()
      toast(t("actions.saveSuccess"))
    },
    onError: (error) => {
      toastFetchError(error)
    },
  })

  return (
    <>
      <SettingsTitle />
      <div className="mt-4 space-y-4">
        {actionsData.map((action, actionIdx) => (
          <ActionCard
            key={actionIdx}
            data={action}
            onChange={(newAction) => {
              if (!newAction) {
                setActionsData(actionsData.filter((_, idx) => idx !== actionIdx))
              } else {
                setActionsData(actionsData.map((a, idx) => (idx === actionIdx ? newAction : a)))
              }
            }}
          />
        ))}
        <Button
          variant="outline"
          className="center w-full gap-1"
          onClick={() => {
            setActionsData([
              ...actionsData,
              {
                name: t("actions.actionName", { number: actionsData.length + 1 }),
                condition: [],
                result: {},
              },
            ])
          }}
        >
          <i className="i-mgc-add-cute-re" />
          <span>{t("actions.newRule")}</span>
        </Button>
        <div className="text-right">
          <Button
            variant="primary"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {t("actions.save")}
          </Button>
        </div>
      </div>
    </>
  )
}