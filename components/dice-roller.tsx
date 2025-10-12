"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dice6, Target, BookOpen, Zap } from "lucide-react"
import "@/styles/dice-roller.css"

interface DiceRollerProps {
  character?: any
}

export function DiceRoller({ character }: DiceRollerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [lastRoll, setLastRoll] = useState<{ result: number; details: string } | null>(null)
  const [customDie, setCustomDie] = useState("d20")
  const [customModifier, setCustomModifier] = useState(0)

  // Função para rolar um dado d20
  const rollD20 = () => {
    return Math.floor(Math.random() * 20) + 1
  }

  // Função para calcular bônus de atributo
  const getAttributeBonus = (attributeValue: number) => {
    return Math.floor((attributeValue - 10) / 2)
  }

  // Rolagem de atributo
  const rollAttribute = (attribute: string, value: number) => {
    const roll = rollD20()
    const bonus = getAttributeBonus(value)
    const total = roll + bonus
    const details = `${roll} (d20) + ${bonus >= 0 ? "+" : ""}${bonus} (atributo) = ${total}`

    setLastRoll({
      result: total,
      details: `${attribute.toUpperCase()}: ${details}`,
    })
  }

  // Rolagem de perícia
  const rollSkill = (skillName: string, attribute: string, training: string | boolean = "destreinado") => {
    const roll = rollD20()

    // Bônus de atributo
    const attributeValue = character?.atributos?.[attribute] || 10
    const attributeBonus = getAttributeBonus(attributeValue)

    // Metade do nível (sempre adicionado, mesmo sem treino)
    const level = character?.classes?.reduce((acc: number, cls: any) => acc + (cls.nivel || 0), 0) || 0
    const levelBonus = Math.floor(level / 2)

    // Bônus de treinamento baseado no nível do personagem
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

    // Bônus adicionais da perícia (se houver)
    const skillData = character?.pericias?.[skillName] || {}
    const others = skillData.outros || 0
    const bonusExtra =
      typeof skillData.bonusExtra === "number"
        ? skillData.bonusExtra
        : typeof skillData.bonusExtra === "string" && skillData.bonusExtra !== ""
          ? Number.parseInt(skillData.bonusExtra) || 0
          : 0

    // Penalidade de armadura (se aplicável)
    let armorPenalty = 0
    const skillInfo = skills.find((s) => s.name === skillName)
    if (skillInfo?.armorPenalty) {
      const armor = character?.inventario?.armaduras?.find((a: any) => a.equipada)
      if (armor) {
        armorPenalty = Math.abs(armor.penalidade || 0)
      }
    }

    const total = roll + levelBonus + attributeBonus + trainingBonus + others + bonusExtra - armorPenalty

    // Construir detalhes da rolagem
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
    })
  }

  // Rolagem personalizada
  const rollCustom = (dice: string, modifier = 0) => {
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

    setLastRoll({
      result: total,
      details: `${dice.toUpperCase()}${modifierText}: ${details}`,
    })
  }

  // Lista de atributos
  const attributes = [
    { key: "forca", name: "Força", icon: "💪" },
    { key: "destreza", name: "Destreza", icon: "🏃" },
    { key: "constituicao", name: "Constituição", icon: "🛡️" },
    { key: "inteligencia", name: "Inteligência", icon: "🧠" },
    { key: "sabedoria", name: "Sabedoria", icon: "👁️" },
    { key: "carisma", name: "Carisma", icon: "😊" },
  ]

  // Lista de perícias comuns e suas propriedades
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

  // Dados personalizados
  const customDice = ["d20", "d12", "d10", "d8", "d6", "d4"]

  return (
    <div className="fixed bottom-6 right-6 z-[10001] flex flex-col items-end gap-2">
      {/* Botão Flutuante */}
      <Button
        size="lg"
        className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary text-primary-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Dice6 className="w-6 h-6" />
      </Button>

      {/* Painel de Rolagem */}
      {isOpen && (
        <Card className="dice-roller-card absolute bottom-16 right-0 w-80 shadow-xl border-2 text-card-foreground border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
              <Dice6 className="w-5 h-5 text-primary" />
              Rolagem de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Última Rolagem */}
            {lastRoll && (
              <div className="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-green-800 dark:text-green-200">Última Rolagem</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
                  >
                    {lastRoll.result}
                  </Badge>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">{lastRoll.details}</p>
              </div>
            )}

            <Tabs defaultValue="attributes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted">
                <TabsTrigger value="attributes" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  Atributos
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Perícias
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Diversos
                </TabsTrigger>
              </TabsList>

              {/* Aba de Atributos */}
              <TabsContent value="attributes" className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {attributes.map((attr) => {
                    const value = character?.atributos?.[attr.key] || 10
                    const bonus = getAttributeBonus(value)
                    return (
                      <Button
                        key={attr.key}
                        variant="outline"
                        size="sm"
                        className="justify-start hover:bg-accent hover:text-accent-foreground h-auto p-2 flex flex-col items-center gap-1 border-border"
                        onClick={() => rollAttribute(attr.name, value)}
                      >
                        <span className="text-lg">{attr.icon}</span>
                        <span className="text-xs font-medium">{attr.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {bonus >= 0 ? "+" : ""}
                          {bonus}
                        </Badge>
                      </Button>
                    )
                  })}
                </div>
              </TabsContent>

              {/* Aba de Perícias */}
              <TabsContent value="skills" className="space-y-2">
                <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
                  {skills.map((skill) => (
                    <Button
                      key={skill.name}
                      variant="outline"
                      size="sm"
                      className="h-8 justify-start text-xs border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => rollSkill(skill.name, skill.attribute)}
                    >
                      {skill.name}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {skill.attribute.substring(0, 3).toUpperCase()}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              {/* Aba de Dados Personalizados */}
              <TabsContent value="custom" className="space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Rolagem Personalizada:</p>
                  <div className="flex items-center gap-2">
                    <Select value={customDie} onValueChange={setCustomDie}>
                      <SelectTrigger className="w-24">
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
                      placeholder="Modificador"
                      className="w-28"
                      value={customModifier}
                      onChange={(e) => setCustomModifier(parseInt(e.target.value) || 0)}
                    />
                    <Button
                      size="sm"
                      className="flex-grow"
                      onClick={() => rollCustom(customDie, customModifier)}
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
                      className="border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => rollCustom(dice)}
                    >
                      {dice.toUpperCase()}
                    </Button>
                  ))}
                </div>

                {/* Modificadores comuns */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Com Modificadores:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => rollCustom("d20", 5)}
                    >
                      d20+5
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => rollCustom("d20", 10)}
                    >
                      d20+10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => rollCustom("d20", -2)}
                    >
                      d20-2
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => rollCustom("d20", -5)}
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
