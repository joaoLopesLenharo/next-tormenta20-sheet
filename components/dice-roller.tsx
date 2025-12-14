"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dice6, Target, BookOpen, Zap, Sparkles } from "lucide-react"
import "@/styles/dice-roller.css"

interface DiceRollerProps {
  character?: any
}

export function DiceRoller({ character }: DiceRollerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [lastRoll, setLastRoll] = useState<{
    result: number
    details: string
    isCrit?: boolean
    isFail?: boolean
  } | null>(null)
  const [customDie, setCustomDie] = useState("d20")
  const [customModifier, setCustomModifier] = useState(0)
  const [isRolling, setIsRolling] = useState(false)

  const rollD20 = () => {
    return Math.floor(Math.random() * 20) + 1
  }

  const getAttributeBonus = (attributeValue: number) => {
    return Math.floor((attributeValue - 10) / 2)
  }

  const animateRoll = async () => {
    setIsRolling(true)
    await new Promise((resolve) => setTimeout(resolve, 450))
    setIsRolling(false)
  }

  const rollAttribute = async (attribute: string, value: number) => {
    await animateRoll()
    const roll = rollD20()
    const bonus = getAttributeBonus(value)
    const total = roll + bonus
    const details = `${roll} (d20) + ${bonus >= 0 ? "+" : ""}${bonus} (atributo) = ${total}`

    setLastRoll({
      result: total,
      details: `${attribute.toUpperCase()}: ${details}`,
      isCrit: roll === 20,
      isFail: roll === 1,
    })
  }

  const rollSkill = async (skillName: string, attribute: string, training: string | boolean = "destreinado") => {
    await animateRoll()
    const roll = rollD20()

    const attributeValue = character?.atributos?.[attribute] || 10
    const attributeBonus = getAttributeBonus(attributeValue)

    const level = character?.classes?.reduce((acc: number, cls: any) => acc + (cls.nivel || 0), 0) || 0
    const levelBonus = Math.floor(level / 2)

    let trainingBonus = 0
    const isTrained = training === true || (typeof training === "string" && training !== "destreinado")

    if (isTrained) {
      if (level >= 15) {
        trainingBonus = 6
      } else if (level >= 7) {
        trainingBonus = 4
      } else {
        trainingBonus = 2
      }
    }

    const skillData = character?.pericias?.[skillName] || {}
    const others = skillData.outros || 0
    const bonusExtra =
      typeof skillData.bonusExtra === "number"
        ? skillData.bonusExtra
        : typeof skillData.bonusExtra === "string" && skillData.bonusExtra !== ""
          ? Number.parseInt(skillData.bonusExtra) || 0
          : 0

    let armorPenalty = 0
    const skillInfo = skills.find((s) => s.name === skillName)
    if (skillInfo?.armorPenalty) {
      const armor = character?.inventario?.armaduras?.find((a: any) => a.equipada)
      if (armor) {
        armorPenalty = Math.abs(armor.penalidade || 0)
      }
    }

    const total = roll + levelBonus + attributeBonus + trainingBonus + others + bonusExtra - armorPenalty

    const detailsParts = [
      `${roll} (d20)`,
      `${levelBonus >= 0 ? "+" : ""}${levelBonus} (nível)`,
      `${attributeBonus >= 0 ? "+" : ""}${attributeBonus} (atributo)`,
      isTrained && `${trainingBonus >= 0 ? "+" : ""}${trainingBonus} (treino)`,
      others !== 0 && `${others >= 0 ? "+" : ""}${others} (outros)`,
      bonusExtra !== 0 && `${bonusExtra >= 0 ? "+" : ""}${bonusExtra} (bônus)`,
      armorPenalty !== 0 && `-${armorPenalty} (pen. armadura)`,
    ]
      .filter(Boolean)
      .join(" + ")

    setLastRoll({
      result: total,
      details: `${skillName}: ${detailsParts} = ${total}`,
      isCrit: roll === 20,
      isFail: roll === 1,
    })
  }

  const rollCustom = async (dice: string, modifier = 0) => {
    await animateRoll()
    let roll = 0
    let rollDetails = ""

    if (dice === "d20") {
      roll = rollD20()
      rollDetails = `${roll} (d20)`
    } else if (dice === "d12") {
      roll = Math.floor(Math.random() * 12) + 1
      rollDetails = `${roll} (d12)`
    } else if (dice === "d10") {
      roll = Math.floor(Math.random() * 10) + 1
      rollDetails = `${roll} (d10)`
    } else if (dice === "d8") {
      roll = Math.floor(Math.random() * 8) + 1
      rollDetails = `${roll} (d8)`
    } else if (dice === "d6") {
      roll = Math.floor(Math.random() * 6) + 1
      rollDetails = `${roll} (d6)`
    } else if (dice === "d4") {
      roll = Math.floor(Math.random() * 4) + 1
      rollDetails = `${roll} (d4)`
    }

    const total = roll + modifier
    const modifierText = modifier !== 0 ? `${modifier >= 0 ? "+" : ""}${modifier}` : ""
    const details = modifierText ? `${rollDetails} ${modifierText} = ${total}` : `${rollDetails} = ${total}`

    const isCrit = dice === "d20" && roll === 20
    const isFail = dice === "d20" && roll === 1

    setLastRoll({
      result: total,
      details: `${dice.toUpperCase()}${modifierText}: ${details}`,
      isCrit,
      isFail,
    })
  }

  const attributes = [
    { key: "forca", name: "Força", abbr: "FOR" },
    { key: "destreza", name: "Destreza", abbr: "DES" },
    { key: "constituicao", name: "Constituição", abbr: "CON" },
    { key: "inteligencia", name: "Inteligência", abbr: "INT" },
    { key: "sabedoria", name: "Sabedoria", abbr: "SAB" },
    { key: "carisma", name: "Carisma", abbr: "CAR" },
  ]

  const skills: Array<{
    name: string
    attribute: string
    armorPenalty?: boolean
    trainedOnly?: boolean
  }> = [
    { name: "Acrobacia", attribute: "destreza", armorPenalty: true },
    { name: "Atletismo", attribute: "forca", armorPenalty: true },
    { name: "Diplomacia", attribute: "carisma" },
    { name: "Enganação", attribute: "carisma" },
    { name: "Fortitude", attribute: "constituicao" },
    { name: "Furtividade", attribute: "destreza", armorPenalty: true },
    { name: "Intimidação", attribute: "carisma" },
    { name: "Intuição", attribute: "sabedoria" },
    { name: "Investigação", attribute: "inteligencia" },
    { name: "Luta", attribute: "forca", armorPenalty: true },
    { name: "Medicina", attribute: "inteligencia", trainedOnly: true },
    { name: "Percepção", attribute: "sabedoria" },
    { name: "Pilotagem", attribute: "destreza", armorPenalty: true },
    { name: "Pontaria", attribute: "destreza", armorPenalty: true },
    { name: "Reflexos", attribute: "destreza" },
    { name: "Religião", attribute: "sabedoria", trainedOnly: true },
    { name: "Sobrevivência", attribute: "sabedoria" },
    { name: "Tecnologia", attribute: "inteligencia", trainedOnly: true },
    { name: "Vontade", attribute: "sabedoria" },
  ]

  const customDice = ["d20", "d12", "d10", "d8", "d6", "d4"]

  return (
    <div className="fixed bottom-6 right-6 z-[10001] flex flex-col items-end gap-2">
      <Button
        size="lg"
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground border-2 border-primary/20 ${isRolling ? "rolling" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Dice6 className="w-6 h-6" />
      </Button>

      {isOpen && (
        <Card className="dice-roller-card absolute bottom-16 right-0 w-80 shadow-xl border-2 text-card-foreground border-border">
          <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-muted/50 to-muted">
            <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              Rolagem de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {lastRoll && (
              <div
                className={`p-4 rounded-lg border ${lastRoll.isCrit ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700" : lastRoll.isFail ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700" : "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-semibold ${lastRoll.isCrit ? "text-amber-700 dark:text-amber-300" : lastRoll.isFail ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}
                  >
                    {lastRoll.isCrit ? "Crítico!" : lastRoll.isFail ? "Falha Crítica!" : "Última Rolagem"}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-lg font-bold result-number ${lastRoll.isCrit ? "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 critical-hit" : lastRoll.isFail ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-100 critical-fail" : "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-100"}`}
                  >
                    {lastRoll.result}
                  </Badge>
                </div>
                <p
                  className={`text-sm ${lastRoll.isCrit ? "text-amber-600 dark:text-amber-400" : lastRoll.isFail ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                >
                  {lastRoll.details}
                </p>
              </div>
            )}

            <Tabs defaultValue="attributes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/80 p-1 rounded-lg">
                <TabsTrigger
                  value="attributes"
                  className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Atrib.
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Perícias
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Dados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="attributes" className="space-y-2 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  {attributes.map((attr) => {
                    const value = character?.atributos?.[attr.key] || 10
                    const bonus = getAttributeBonus(value)
                    return (
                      <Button
                        key={attr.key}
                        variant="outline"
                        size="sm"
                        className="justify-center h-auto p-3 flex flex-col items-center gap-1 border-border hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all bg-transparent"
                        onClick={() => rollAttribute(attr.name, value)}
                        disabled={isRolling}
                      >
                        <span className="text-xs font-medium text-muted-foreground">{attr.abbr}</span>
                        <span className="text-sm font-semibold">{attr.name}</span>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          {bonus >= 0 ? "+" : ""}
                          {bonus}
                        </Badge>
                      </Button>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-2 mt-3">
                <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto pr-1">
                  {skills.map((skill) => (
                    <Button
                      key={skill.name}
                      variant="ghost"
                      size="sm"
                      className="h-9 justify-between text-xs hover:bg-primary/10 hover:text-primary"
                      onClick={() => rollSkill(skill.name, skill.attribute)}
                      disabled={isRolling}
                    >
                      <span className="truncate">{skill.name}</span>
                      <Badge variant="outline" className="text-xs ml-2 shrink-0">
                        {skill.attribute.substring(0, 3).toUpperCase()}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4 mt-3">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Rolagem Personalizada</p>
                  <div className="flex items-center gap-2">
                    <Select value={customDie} onValueChange={setCustomDie}>
                      <SelectTrigger className="w-20 h-9">
                        <SelectValue placeholder="Dado" />
                      </SelectTrigger>
                      <SelectContent className="z-[10002]">
                        {customDice.map((dice) => (
                          <SelectItem key={dice} value={dice}>
                            {dice.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Mod"
                      className="w-20 h-9 text-center"
                      value={customModifier}
                      onChange={(e) => setCustomModifier(Number.parseInt(e.target.value) || 0)}
                    />
                    <Button
                      size="sm"
                      className="flex-1 h-9 bg-primary hover:bg-primary/90"
                      onClick={() => rollCustom(customDie, customModifier)}
                      disabled={isRolling}
                    >
                      Rolar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {customDice.map((dice) => (
                    <Button
                      key={dice}
                      variant="outline"
                      size="sm"
                      className="h-10 font-semibold border-border hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all bg-transparent"
                      onClick={() => rollCustom(dice)}
                      disabled={isRolling}
                    >
                      {dice.toUpperCase()}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Atalhos</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-primary/10 hover:border-primary/50 bg-transparent"
                      onClick={() => rollCustom("d20", 5)}
                      disabled={isRolling}
                    >
                      d20+5
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-primary/10 hover:border-primary/50 bg-transparent"
                      onClick={() => rollCustom("d20", 10)}
                      disabled={isRolling}
                    >
                      d20+10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-primary/10 hover:border-primary/50 bg-transparent"
                      onClick={() => rollCustom("d20", -2)}
                      disabled={isRolling}
                    >
                      d20-2
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-primary/10 hover:border-primary/50 bg-transparent"
                      onClick={() => rollCustom("d20", -5)}
                      disabled={isRolling}
                    >
                      d20-5
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
