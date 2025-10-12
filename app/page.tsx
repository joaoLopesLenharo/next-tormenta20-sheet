"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronDown,
  Plus,
  Trash2,
  Download,
  Upload,
  Dice6,
  Shield,
  Zap,
  BookOpen,
  Package,
  Settings,
  Moon,
  Sun,
  Camera,
  ChevronRight,
  Filter,
  X,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { DiceRoller } from "@/components/dice-roller"

// TypeScript interfaces
interface CharacterType {
  nome: string
  nivel: number
  raca: string
  classes: any[]
  divindade: string
  tendencia: string
  origem: string
  deslocamento: number
  foto: string | PhotoData
  defenseAttribute: string
  atributos: {
    forca: number
    destreza: number
    constituicao: number
    inteligencia: number
    sabedoria: number
    carisma: number
  }
  recursos: {
    vida: { atual: number; maximo: number; cor: string }
    mana: { atual: number; maximo: number; cor: string }
    prana: { atual: number; maximo: number; cor: string }
    recursos_extras: any[]
  } & Record<string, any>
  defesa: number
  defesa_outros?: number // Added for defense bonus
  pericias: PericiasType
  inventario: {
    armas: any[]
    armaduras: any[]
    itens: any[]
    dinheiro: Record<string, number>
  }
  magias: {
    arcana: Record<string, any[]>
    divina: Record<string, any[]>
  } & Record<string, any>
  habilidades: any[]
  poderes: any[]
}

interface Sheet {
  id: string
  meta: {
    nome: string
    nivel: number
  }
  data: CharacterType
}

interface AlertType {
  show: boolean
  type: string
  message: string
}

interface PhotoData {
  src: string
  srcOriginal?: string
  zoom: number
  offsetX: number
  offsetY: number
}

interface TempPhotoType {
  src: string
  srcOriginal?: string
  zoom: number
  offsetX: number
  offsetY: number
}

interface DragPosition {
  x: number
  y: number
}

interface CollapsedSectionsType {
  [key: string]: boolean
}

interface SkillData {
  attr: string
  armorPenalty?: boolean
  trainedOnly?: boolean
}

interface PericiaType {
  treinada?: boolean
  outros?: number
  atributo?: string
  bonusExtra?: number | string
  desconto?: string
}

interface PericiasType {
  [key: string]: PericiaType
}
export default function CharacterSheet() {
  // State management
  const [character, setCharacter] = useState<CharacterType | null>(null)
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSectionsType>({})
  const [alert, setAlert] = useState<AlertType>({ show: false, type: "", message: "" })
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [photoEditModal, setPhotoEditModal] = useState<boolean>(false)
  const [tempPhoto, setTempPhoto] = useState<TempPhotoType>({ src: "", zoom: 1, offsetX: 0, offsetY: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<DragPosition>({ x: 0, y: 0 })
  const [dragOrigin, setDragOrigin] = useState<DragPosition>({ x: 0, y: 0 })

  const [skillFilters, setSkillFilters] = useState({
    name: "",
    attribute: "all",
    training: "all", // "all" | "trained" | "untrained"
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const photoEditRef = useRef<HTMLImageElement>(null)
  const photoEditCircleRef = useRef<HTMLDivElement>(null)

  // Initialize character data
  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = () => {
    const defaultCharacter = getDefaultCharacter()
    const savedSheets = getSheetsFromStorage()

    if (savedSheets.length > 0) {
      const activeId = localStorage.getItem("t20_active_sheet_id")
      const activeSheet = savedSheets.find((s: Sheet) => s.id === activeId) || savedSheets[0]

      setSheets(savedSheets)
      setActiveSheetId(activeSheet.id)
      setCharacter(activeSheet.data)
    } else {
      const newId = generateId()
      const newSheet = {
        id: newId,
        meta: { nome: "Nova Ficha", nivel: 1 },
        data: defaultCharacter,
      }

      setSheets([newSheet])
      setActiveSheetId(newId)
      setCharacter(defaultCharacter)
      saveSheets([newSheet])
    }

    // Load theme preference
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }

  const getDefaultCharacter = () => ({
    nome: "",
    nivel: 1,
    raca: "",
    classes: [],
    divindade: "",
    tendencia: "",
    origem: "",
    deslocamento: 9,
    foto: "",
    defenseAttribute: "destreza",
    atributos: {
      forca: 10,
      destreza: 10,
      constituicao: 10,
      inteligencia: 10,
      sabedoria: 10,
      carisma: 10,
    },
    recursos: {
      vida: { atual: 0, maximo: 0, cor: "#ef4444" },
      mana: { atual: 0, maximo: 0, cor: "#3b82f6" },
      prana: { atual: 0, maximo: 0, cor: "#eab308" },
      recursos_extras: [],
    },
    defesa: 10, // Default value for defense
    defesa_outros: 0, // Default value for defense outros bonus
    pericias: {},
    inventario: {
      armas: [],
      armaduras: [],
      itens: [],
      dinheiro: { T$: 0, PP: 0, PO: 0, PE: 0, PC: 0 },
    },
    magias: {
      arcana: { "1º": [], "2º": [], "3º": [], "4º": [], "5º": [] },
      divina: { "1º": [], "2º": [], "3º": [], "4º": [], "5º": [] },
    },
    habilidades: [],
    poderes: [],
  })

  const generateId = () => "t20_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

  const getSheetsFromStorage = () => {
    try {
      const raw = localStorage.getItem("t20_sheets")
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  const saveSheets = (sheetsData: Sheet[]) => {
    try {
      localStorage.setItem("t20_sheets", JSON.stringify(sheetsData))
    } catch (error) {
      console.error("Error saving sheets:", error)
    }
  }

  const updateCharacter = (updates: Partial<CharacterType>) => {
    const updatedCharacter = { ...character, ...updates } as CharacterType
    setCharacter(updatedCharacter)

    // Update in sheets array
    const updatedSheets = sheets.map((sheet) =>
      sheet.id === activeSheetId
        ? {
            ...sheet,
            data: updatedCharacter,
            meta: { nome: updatedCharacter.nome || "Nova Ficha", nivel: getTotalLevel(updatedCharacter) },
          }
        : sheet,
    )
    setSheets(updatedSheets)
    saveSheets(updatedSheets)
  }

  const getTotalLevel = (char = character) => {
    return (char?.classes || []).reduce((acc, c) => acc + (Number.parseInt(c.nivel) || 0), 0) || char?.nivel || 1
  }

  const getAttributeModifier = (attribute: keyof CharacterType["atributos"]) => {
    const value = character?.atributos?.[attribute] || 10
    return Math.floor((value - 10) / 2)
  }

  // Get current armor penalty (0 if no armor or no penalty)
  const getArmorPenalty = () => {
    if (!character?.inventario?.armaduras) return 0
    const equippedArmor = character.inventario.armaduras.find((a) => a.equipada)
    return equippedArmor ? Math.abs(equippedArmor.penalidade || 0) : 0
  }

  const calculateDefense = () => {
    if (!character) return 10
    const baseDefense = 10
    const selectedAttr = character.defenseAttribute || "destreza"
    const attrMod = getAttributeModifier(selectedAttr as keyof CharacterType["atributos"])

    const equippedArmor = character.inventario?.armaduras?.find((a) => a.equipada && a.categoria !== "escudo")
    const equippedShield = character.inventario?.armaduras?.find((a) => a.equipada && a.categoria === "escudo")
    const armorBonus = equippedArmor?.ca || 0
    const shieldBonus = equippedShield?.ca || 0

    // Get "outros" bonus from defense field
    const outrosBonus = character.defesa_outros || 0

    return baseDefense + attrMod + armorBonus + shieldBonus + outrosBonus
  }

  const showAlert = (type: string, message: string) => {
    setAlert({ show: true, type, message })
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000)
  }

  const toggleTheme = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const exportCharacter = () => {
    if (!character) {
      showAlert("error", "Nenhum personagem para exportar")
      return
    }

    try {
      const exportData = {
        character: character,
        validation_notes: "Exported from Tormenta 20 Character Sheet",
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(dataBlob)
      link.download = `${character.nome || "personagem"}_tormenta20.json`
      link.click()

      showAlert("success", "Personagem exportado com sucesso!")
    } catch (error) {
      console.error("Export error:", error)
      showAlert("error", "Erro ao exportar personagem")
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        const characterData = data.character || data

        // Create new sheet with imported data
        const newId = generateId()
        const newSheet = {
          id: newId,
          meta: { nome: characterData.nome || "Ficha Importada", nivel: getTotalLevel(characterData) },
          data: { ...getDefaultCharacter(), ...characterData },
        }

        const updatedSheets = [...sheets, newSheet]
        setSheets(updatedSheets)
        setActiveSheetId(newId)
        setCharacter(newSheet.data)
        saveSheets(updatedSheets)

        showAlert("success", "Personagem importado com sucesso!")
        event.target.value = ""
      } catch (error) {
        console.error("Import error:", error)
        showAlert("error", "Erro ao importar arquivo JSON")
        event.target.value = ""
      }
    }

    reader.readAsText(file)
  }

  const createNewSheet = () => {
    const newId = generateId()
    const newSheet = {
      id: newId,
      meta: { nome: "Nova Ficha", nivel: 1 },
      data: getDefaultCharacter(),
    }

    const updatedSheets = [...sheets, newSheet]
    setSheets(updatedSheets)
    setActiveSheetId(newId)
    setCharacter(newSheet.data)
    saveSheets(updatedSheets)
    setSidebarOpen(false)
  }

  const switchToSheet = (sheetId: string) => {
    const sheet = sheets.find((s) => s.id === sheetId)
    if (sheet) {
      setActiveSheetId(sheetId)
      setCharacter(sheet.data)
      localStorage.setItem("t20_active_sheet_id", sheetId)
      setSidebarOpen(false)
    }
  }

  const deleteSheet = (sheetId: string) => {
    if (sheets.length === 1) {
      createNewSheet()
    }

    const updatedSheets = sheets.filter((s) => s.id !== sheetId)
    setSheets(updatedSheets)
    saveSheets(updatedSheets)

    if (activeSheetId === sheetId && updatedSheets.length > 0) {
      const newActive = updatedSheets[0]
      setActiveSheetId(newActive.id)
      setCharacter(newActive.data)
      localStorage.setItem("t20_active_sheet_id", newActive.id)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showAlert("error", "Imagem muito grande. Máximo 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const photoData = {
        src: e.target?.result as string,
        srcOriginal: e.target?.result as string,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }
      updateCharacter({ foto: photoData })
      showAlert("success", "Foto do personagem atualizada!")
    }
    reader.readAsDataURL(file)
  }

  const openPhotoEditModal = () => {
    if (character?.foto && typeof character.foto === "object") {
      setTempPhoto({
        src: character.foto.srcOriginal || character.foto.src || "",
        zoom: character.foto.zoom || 1,
        offsetX: character.foto.offsetX || 0,
        offsetY: character.foto.offsetY || 0,
      })
    } else if (character?.foto && typeof character.foto === "string") {
      setTempPhoto({
        src: character.foto,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      })
    } else {
      setTempPhoto({ src: "", zoom: 1, offsetX: 0, offsetY: 0 })
    }
    setPhotoEditModal(true)
  }

  const handlePhotoEditUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showAlert("error", "Imagem muito grande. Máximo 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setTempPhoto({
        src: e.target?.result as string,
        srcOriginal: e.target?.result as string,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      })
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoZoom = (delta: number) => {
    setTempPhoto((prev) => ({
      ...prev,
      zoom: Math.max(1, Math.min(3, prev.zoom + delta)),
    }))
  }

  const handlePhotoWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.08 : -0.08
    handlePhotoZoom(delta)
  }

  const handlePhotoDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!tempPhoto.src) return
    setIsDragging(true)
    let clientX: number, clientY: number

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if ("clientX" in e) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      return
    }

    setDragStart({ x: clientX, y: clientY })
    setDragOrigin({ x: tempPhoto.offsetX, y: clientY })
  }

  const handlePhotoDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !tempPhoto.src) return
    e.preventDefault()

    let clientX: number, clientY: number

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if ("clientX" in e) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      return
    }

    const circle = photoEditCircleRef.current
    if (!circle) return

    const dx = (clientX - dragStart.x) / circle.offsetWidth
    const dy = (clientY - dragStart.y) / circle.offsetHeight

    const maxOffset = 0.5
    const newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, dragOrigin.x + dx))
    const newOffsetY = Math.max(-maxOffset, Math.min(maxOffset, dragOrigin.y + dy))

    setTempPhoto((prev) => ({
      ...prev,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    }))
  }

  const handlePhotoDragEnd = () => {
    setIsDragging(false)
  }

  const resetPhotoPosition = () => {
    setTempPhoto((prev) => ({
      ...prev,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    }))
  }

  const removePhoto = () => {
    setTempPhoto({ src: "", zoom: 1, offsetX: 0, offsetY: 0 })
  }

  const savePhotoChanges = () => {
    if (!tempPhoto.src) {
      updateCharacter({ foto: "" })
    } else {
      updateCharacter({ foto: tempPhoto })
    }
    setPhotoEditModal(false)
    showAlert("success", "Foto atualizada com sucesso!")
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const reactEvent = e as unknown as React.MouseEvent | React.TouchEvent
      handlePhotoDragMove(reactEvent)
    }
    const handleMouseUp = () => handlePhotoDragEnd()

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleMouseMove, { passive: false })
      document.addEventListener("touchend", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleMouseMove)
      document.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDragging, dragStart, dragOrigin, tempPhoto.offsetX, tempPhoto.offsetY])

  const skillsData = [
    { name: "Acrobacia", attr: "destreza", armorPenalty: true },
    { name: "Adestramento", attr: "carisma", trainedOnly: true },
    { name: "Atletismo", attr: "forca" },
    { name: "Atuação", attr: "carisma" },
    { name: "Cavalgar", attr: "destreza" },
    { name: "Conhecimento", attr: "inteligencia", trainedOnly: true },
    { name: "Cura", attr: "sabedoria" },
    { name: "Diplomacia", attr: "carisma" },
    { name: "Enganação", attr: "carisma" },
    { name: "Fortitude", attr: "constituicao" },
    { name: "Furtividade", attr: "destreza", armorPenalty: true },
    { name: "Guerra", attr: "inteligencia", trainedOnly: true },
    { name: "Iniciativa", attr: "destreza" },
    { name: "Intimidação", attr: "carisma" },
    { name: "Intuição", attr: "sabedoria" },
    { name: "Investigação", attr: "inteligencia" },
    { name: "Jogatina", attr: "carisma", trainedOnly: true },
    { name: "Ladinagem", attr: "destreza", trainedOnly: true, armorPenalty: true },
    { name: "Luta", attr: "forca" },
    { name: "Misticismo", attr: "inteligencia", trainedOnly: true },
    { name: "Nobreza", attr: "inteligencia", trainedOnly: true },
    { name: "Ofício", attr: "inteligencia", trainedOnly: true },
    { name: "Percepção", attr: "sabedoria" },
    { name: "Pilotagem", attr: "destreza", trainedOnly: true },
    { name: "Pontaria", attr: "destreza" },
    { name: "Reflexos", attr: "destreza" },
    { name: "Religião", attr: "sabedoria", trainedOnly: true },
    { name: "Sobrevivência", attr: "sabedoria" },
    { name: "Vontade", attr: "sabedoria" },
  ]

  const getFilteredSkills = () => {
    return skillsData.filter((skillData) => {
      const skill = character.pericias?.[skillData.name] || {}

      // Filter by name
      if (skillFilters.name && !skillData.name.toLowerCase().includes(skillFilters.name.toLowerCase())) {
        return false
      }

      // Filter by attribute
      if (skillFilters.attribute !== "all") {
        const selectedAttr = skill.atributo || skillData.attr
        if (selectedAttr.toLowerCase() !== skillFilters.attribute.toLowerCase()) {
          return false
        }
      }

      // Filter by training status
      if (skillFilters.training !== "all") {
        const isTrained =
          skill.treinada === true || (typeof skill.treinada === "string" && skill.treinada !== "destreinado")
        if (skillFilters.training === "trained" && !isTrained) {
          return false
        }
        if (skillFilters.training === "untrained" && isTrained) {
          return false
        }
      }

      return true
    })
  }

  const clearSkillFilters = () => {
    setSkillFilters({
      name: "",
      attribute: "all",
      training: "all",
    })
  }

  const hasActiveFilters =
    skillFilters.name !== "" || skillFilters.attribute !== "all" || skillFilters.training !== "all"

  const calculateSkillTotal = (
    skillName: string,
    skillData: { name: string; attr: string; trainedOnly?: boolean; armorPenalty?: boolean },
  ) => {
    if (!character) return 0
    const skill = character.pericias?.[skillName] || {}
    const selectedAttr = skill.atributo || skillData.attr
    const attrMod = getAttributeModifier(selectedAttr.toLowerCase() as keyof CharacterType["atributos"])

    // Calculate half level (always added, even if not trained)
    const halfLevel = Math.floor(getTotalLevel() / 2)

    // Calculate training bonus based on character level (if trained)
    let trainingBonus = 0
    const isTrained =
      skill.treinada === true || (typeof skill.treinada === "string" && skill.treinada !== "destreinado")

    if (isTrained) {
      const level = getTotalLevel()
      if (level >= 15) {
        trainingBonus = 6
      } else if (level >= 7) {
        trainingBonus = 4
      } else {
        trainingBonus = 2
      }
    }

    // Other bonuses
    const others = skill.outros || 0
    const bonusExtra =
      typeof skill.bonusExtra === "number"
        ? skill.bonusExtra
        : typeof skill.bonusExtra === "string" && skill.bonusExtra !== ""
          ? Number.parseInt(skill.bonusExtra) || 0
          : 0

    // Armor penalty (if applicable)
    const armorPenalty = skillData.armorPenalty ? getArmorPenalty() : 0

    // Total = Half Level + Attribute Modifier + Training Bonus + Other Bonuses - Armor Penalty
    // Always return the total, even for trained-only skills
    return halfLevel + attrMod + trainingBonus + others + bonusExtra - armorPenalty
  }

  if (!character) {
    return (
      <div className="character-sheet flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Dice6 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Carregando ficha...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("app", darkMode && "dark")}>
      <div className="sidebar-trigger" title="Mostrar fichas" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <ChevronRight className="w-4 h-4" />
      </div>

      <div className={cn("sidebar-overlay", sidebarOpen && "show")} onClick={() => setSidebarOpen(false)} />

      <div className={cn("sidebar-hidden", sidebarOpen && "show")}>
        <div className="p-6 border-b border-sidebar-border bg-sidebar">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-sidebar-foreground">Fichas</h2>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={createNewSheet} className="w-full btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nova Ficha
          </Button>
        </div>

        <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto bg-sidebar">
          {sheets.map((sheet) => {
            const sheetClassName = cn(
              "p-3 rounded-lg border cursor-pointer transition-all duration-200",
              sheet.id === activeSheetId
                ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md"
                : "bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-primary/50",
            )

            return (
              <div key={sheet.id} className={sheetClassName} onClick={() => switchToSheet(sheet.id)}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{sheet.meta?.nome || "Nova Ficha"}</p>
                    <p className="text-xs opacity-75">Nível {sheet.meta?.nivel || 1}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm("Excluir esta ficha?")) {
                        deleteSheet(sheet.id)
                      }
                    }}
                    className="opacity-0 hover-group-show transition-opacity h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="main-content-new">
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="character-photo bg-muted rounded-full w-16 h-16 flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors relative overflow-hidden"
                onClick={openPhotoEditModal}
              >
                {character.foto ? (
                  <img
                    src={typeof character.foto === "object" ? character.foto.src : character.foto}
                    alt="Foto do personagem"
                    className="w-full h-full object-cover"
                    style={{
                      transform:
                        typeof character.foto === "object" && character.foto.zoom !== 1
                          ? `translate(${(character.foto.offsetX || 0) * 100}%, ${(character.foto.offsetY || 0) * 100}%) scale(${character.foto.zoom || 1})`
                          : "none",
                    }}
                  />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0"
                onClick={openPhotoEditModal}
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">{character.nome || "Ficha de Personagem"}</h1>
              <p className="text-muted-foreground">
                {character.raca} • Nível {getTotalLevel()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Importar
            </Button>
            <Button onClick={exportCharacter}>
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </div>
        </div>

        <Tabs defaultValue="basic-info" className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-card border border-border p-2">
            <TabsTrigger value="basic-info" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="attributes" className="flex items-center gap-2">
              <Dice6 className="w-4 h-4" />
              Atributos
            </TabsTrigger>
            <TabsTrigger value="defense" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Defesa
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Perícias
            </TabsTrigger>
            <TabsTrigger value="abilities" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Habilidades
            </TabsTrigger>
            <TabsTrigger value="powers" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Poderes
            </TabsTrigger>
            <TabsTrigger value="magic" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Magias
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventário
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic-info" className="mt-6">
            <Card id="basic-info" className="section-card">
              <Collapsible open={!collapsedSections["basic-info"]} onOpenChange={() => toggleSection("basic-info")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <Settings className="w-5 h-5" />
                    Informações Básicas
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["basic-info"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  <div className="form-grid">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        value={character.nome || ""}
                        onChange={(e) => updateCharacter({ nome: e.target.value })}
                        placeholder="Nome do personagem"
                        className="form-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="raca">Raça</Label>
                      <Input
                        id="raca"
                        value={character.raca || ""}
                        onChange={(e) => updateCharacter({ raca: e.target.value })}
                        placeholder="Raça do personagem"
                        className="form-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origem">Origem</Label>
                      <Input
                        id="origem"
                        value={character.origem || ""}
                        onChange={(e) => updateCharacter({ origem: e.target.value })}
                        placeholder="Origem"
                        className="form-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="divindade">Divindade</Label>
                      <Input
                        id="divindade"
                        value={character.divindade || ""}
                        onChange={(e) => updateCharacter({ divindade: e.target.value })}
                        placeholder="Divindade"
                        className="form-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tendencia">Tendência</Label>
                      <Input
                        id="tendencia"
                        value={character.tendencia || ""}
                        onChange={(e) => updateCharacter({ tendencia: e.target.value })}
                        placeholder="Tendência"
                        className="form-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deslocamento">Deslocamento</Label>
                      <Input
                        id="deslocamento"
                        type="number"
                        value={character.deslocamento || 9}
                        onChange={(e) => updateCharacter({ deslocamento: Number.parseInt(e.target.value) || 9 })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Classes */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Classes</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newClasses = [...(character.classes || []), { nome: "", nivel: 1 }]
                          updateCharacter({ classes: newClasses })
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Classe
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(character.classes || []).map((cls, index) => (
                        <div key={`class-${index}`} className="flex items-center gap-2">
                          <Input
                            value={cls.nome || ""}
                            onChange={(e) => {
                              const newClasses = [...character.classes]
                              newClasses[index] = { ...cls, nome: e.target.value }
                              updateCharacter({ classes: newClasses })
                            }}
                            placeholder="Nome da classe"
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min="1"
                            value={cls.nivel || 1}
                            onChange={(e) => {
                              const newClasses = [...character.classes]
                              newClasses[index] = { ...cls, nivel: Number.parseInt(e.target.value) || 1 }
                              updateCharacter({ classes: newClasses })
                            }}
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newClasses = character.classes.filter((_, i) => i !== index)
                              updateCharacter({ classes: newClasses })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="mt-6">
            <Card id="attributes" className="section-card">
              <Collapsible open={!collapsedSections["attributes"]} onOpenChange={() => toggleSection("attributes")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <Dice6 className="w-5 h-5" />
                    Atributos
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["attributes"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  <div className="attribute-grid">
                    {Object.entries(character.atributos || {}).map(([attr, value]) => {
                      const attributeKey = attr as keyof typeof character.atributos
                      const modifier = Math.floor((value - 10) / 2)
                      const attrNames = {
                        forca: { abbr: "FOR", name: "Força" },
                        destreza: { abbr: "DES", name: "Destreza" },
                        constituicao: { abbr: "CON", name: "Constituição" },
                        inteligencia: { abbr: "INT", name: "Inteligência" },
                        sabedoria: { abbr: "SAB", name: "Sabedoria" },
                        carisma: { abbr: "CAR", name: "Carisma" },
                      }

                      return (
                        <div key={attributeKey} className="attribute-card">
                          <div className="attribute-name">{attrNames[attributeKey]?.name}</div>
                          <div className="attribute-abbr">{attrNames[attributeKey]?.abbr}</div>
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => {
                              const newValue = Number.parseInt(e.target.value) || 10
                              updateCharacter({
                                atributos: { ...character.atributos, [attributeKey]: newValue },
                              })
                            }}
                            className="attribute-value text-center font-bold text-lg mb-2"
                          />
                          <div className="attribute-modifier">{modifier >= 0 ? `+${modifier}` : modifier}</div>
                        </div>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>

          {/* Resources Tab (integrated into main content, no specific Tab value) */}
          <div className="mt-6">
            {" "}
            {/* Wrap in a div as it's not a direct TabsContent */}
            <Card className="section-card">
              <Collapsible open={!collapsedSections["resources"]} onOpenChange={() => toggleSection("resources")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <Zap className="w-5 h-5" />
                    Recursos
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["resources"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  <div className="grid gap-4">
                    {[
                      { key: "vida", label: "Vida", color: "#ef4444" },
                      { key: "mana", label: "Mana", color: "#3b82f6" },
                      { key: "prana", label: "Prana", color: "#eab308" },
                    ].map((resourceType) => {
                      const resourceData = character.recursos?.[resourceType.key] || {
                        atual: 0,
                        maximo: 0,
                        cor: resourceType.color,
                      }
                      const percentage = resourceData.maximo > 0 ? (resourceData.atual / resourceData.maximo) * 100 : 0

                      return (
                        <div key={resourceType.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="capitalize font-semibold">{resourceType.label}</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={resourceData.atual}
                                onChange={(e) => {
                                  const newValue = Number.parseInt(e.target.value) || 0
                                  updateCharacter({
                                    recursos: {
                                      ...character.recursos,
                                      [resourceType.key]: { ...resourceData, atual: newValue },
                                    },
                                  })
                                }}
                                className="w-16 text-center"
                              />
                              <span>/</span>
                              <Input
                                type="number"
                                min="0"
                                value={resourceData.maximo}
                                onChange={(e) => {
                                  const newValue = Number.parseInt(e.target.value) || 0
                                  updateCharacter({
                                    recursos: {
                                      ...character.recursos,
                                      [resourceType.key]: { ...resourceData, maximo: newValue },
                                    },
                                  })
                                }}
                                className="w-16 text-center"
                              />
                            </div>
                          </div>
                          <Progress
                            value={percentage}
                            className="h-3"
                            style={{ "--progress-color": resourceData.cor } as any}
                          />
                        </div>
                      )
                    })}

                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Recursos Personalizados</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newResource = {
                              id: Date.now().toString(),
                              nome: "Novo Recurso",
                              atual: 0,
                              maximo: 0,
                              cor: "#8b5cf6",
                            }
                            updateCharacter({
                              recursos: {
                                ...character.recursos,
                                recursos_extras: [...(character.recursos?.recursos_extras || []), newResource],
                              },
                            })
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Recurso
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {(character.recursos?.recursos_extras || []).map((resource, index) => {
                          const percentage = resource.maximo > 0 ? (resource.atual / resource.maximo) * 100 : 0

                          return (
                            <div
                              key={`extra-resource-${resource.id || index}-${resource.nome || "unnamed"}`}
                              className="space-y-2 p-4 border rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Input
                                  value={resource.nome}
                                  onChange={(e) => {
                                    const newExtras = [...(character.recursos?.recursos_extras || [])]
                                    newExtras[index] = { ...resource, nome: e.target.value }
                                    updateCharacter({
                                      recursos: {
                                        ...character.recursos,
                                        recursos_extras: newExtras,
                                      },
                                    })
                                  }}
                                  placeholder="Nome do recurso"
                                  className="flex-1"
                                />
                                <input
                                  type="color"
                                  value={resource.cor}
                                  onChange={(e) => {
                                    const newExtras = [...(character.recursos?.recursos_extras || [])]
                                    newExtras[index] = { ...resource, cor: e.target.value }
                                    updateCharacter({
                                      recursos: {
                                        ...character.recursos,
                                        recursos_extras: newExtras,
                                      },
                                    })
                                  }}
                                  className="w-8 h-8 rounded border"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newExtras = (character.recursos?.recursos_extras || []).filter(
                                      (_, i) => i !== index,
                                    )
                                    updateCharacter({
                                      recursos: {
                                        ...character.recursos,
                                        recursos_extras: newExtras,
                                      },
                                    })
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={resource.atual}
                                  onChange={(e) => {
                                    const newValue = Number.parseInt(e.target.value) || 0
                                    const newExtras = [...(character.recursos?.recursos_extras || [])]
                                    newExtras[index] = { ...resource, atual: newValue }
                                    updateCharacter({
                                      recursos: {
                                        ...character.recursos,
                                        recursos_extras: newExtras,
                                      },
                                    })
                                  }}
                                  className="w-16 text-center"
                                />
                                <span>/</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={resource.maximo}
                                  onChange={(e) => {
                                    const newValue = Number.parseInt(e.target.value) || 0
                                    const newExtras = [...(character.recursos?.recursos_extras || [])]
                                    newExtras[index] = { ...resource, maximo: newValue }
                                    updateCharacter({
                                      recursos: {
                                        ...character.recursos,
                                        recursos_extras: newExtras,
                                      },
                                    })
                                  }}
                                  className="w-16 text-center"
                                />
                              </div>

                              <Progress
                                value={percentage}
                                className="resource-bar"
                                style={{ "--progress-color": resource.cor } as any}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>

          {/* Defense Tab */}
          <TabsContent value="defense" className="mt-6">
            <Card id="defense" className="section-card">
              <Collapsible open={!collapsedSections["defense"]} onOpenChange={() => toggleSection("defense")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <Shield className="w-5 h-5" />
                    Defesa
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["defense"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  <div className="mb-6">
                    <Label htmlFor="defense-attribute">Atributo da Defesa</Label>
                    <select
                      id="defense-attribute"
                      value={character.defenseAttribute || "destreza"}
                      onChange={(e) => updateCharacter({ defenseAttribute: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="forca">Força</option>
                      <option value="destreza">Destreza</option>
                      <option value="constituicao">Constituição</option>
                      <option value="inteligencia">Inteligência</option>
                      <option value="sabedoria">Sabedoria</option>
                      <option value="carisma">Carisma</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <Label className="text-sm font-medium text-primary">Defesa Total</Label>
                      <div className="text-3xl font-bold text-primary mt-2">{calculateDefense()}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        10 + {character.defenseAttribute?.slice(0, 3).toUpperCase() || "DES"} + Armadura + Escudo +
                        Outros
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="armor-bonus">Bônus Armadura</Label>
                      <div className="text-center p-2 bg-muted rounded border">
                        {character.inventario?.armaduras?.find((a) => a.equipada && a.categoria !== "escudo")?.ca || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Automático (equipada)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shield-bonus">Bônus Escudo</Label>
                      <div className="text-center p-2 bg-muted rounded border">
                        {character.inventario?.armaduras?.find((a) => a.equipada && a.categoria === "escudo")?.ca || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Automático (equipado)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="other-defense">Outros Bônus (Defesa)</Label>
                      <Input
                        id="other-defense"
                        type="number"
                        value={character.defesa_outros || 0}
                        onChange={(e) => {
                          updateCharacter({ defesa_outros: Number.parseInt(e.target.value) || 0 })
                        }}
                        className="form-input text-center"
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">Magias, habilidades</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Penalidade de Armadura</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Penalidade atual:{" "}
                      <strong>{character.inventario?.armaduras?.find((a) => a.equipada)?.penalidade || 0}</strong>
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Afeta: Acrobacia, Furtividade, Ladinagem
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="mt-6">
            <Card id="skills" className="section-card">
              <Collapsible open={!collapsedSections["skills"]} onOpenChange={() => toggleSection("skills")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <BookOpen className="w-5 h-5" />
                    Perícias
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["skills"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                    <p>
                      <strong>Cálculo:</strong> Total = ½ Nível + Mod. Atributo + Treino + Outros - Penalidade de
                      Armadura
                    </p>
                    <p className="mb-2">
                      <strong>Fórmula:</strong> ½ Nível + Modificador de Atributo + Treino (2/4/6 se treinado) + Outros
                      - Penalidade de Armadura
                      {getArmorPenalty() > 0 && (
                        <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                          (Penalidade atual: -{getArmorPenalty()} nas perícias afetadas)
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-purple-500">G</span> = Somente treinado
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⚠</span> = Penalidade de armadura
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⚡</span> = Atributo customizado
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Dica: Clique no seletor de atributo para alterar qual atributo a perícia usa.
                    </p>
                  </div>

                  <Card className="mb-4 p-4 bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="w-4 h-4" />
                      <h3 className="font-semibold text-sm">Filtros</h3>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearSkillFilters} className="ml-auto h-7 text-xs">
                          <X className="w-3 h-3 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Name filter */}
                      <div className="space-y-1.5">
                        <Label htmlFor="filter-name" className="text-xs">
                          Nome
                        </Label>
                        <Input
                          id="filter-name"
                          placeholder="Buscar perícia..."
                          value={skillFilters.name}
                          onChange={(e) => setSkillFilters({ ...skillFilters, name: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      {/* Attribute filter */}
                      <div className="space-y-1.5">
                        <Label htmlFor="filter-attribute" className="text-xs">
                          Atributo
                        </Label>
                        <Select
                          value={skillFilters.attribute}
                          onValueChange={(value) => setSkillFilters({ ...skillFilters, attribute: value })}
                        >
                          <SelectTrigger id="filter-attribute" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="forca">Força</SelectItem>
                            <SelectItem value="destreza">Destreza</SelectItem>
                            <SelectItem value="constituicao">Constituição</SelectItem>
                            <SelectItem value="inteligencia">Inteligência</SelectItem>
                            <SelectItem value="sabedoria">Sabedoria</SelectItem>
                            <SelectItem value="carisma">Carisma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Training filter */}
                      <div className="space-y-1.5">
                        <Label htmlFor="filter-training" className="text-xs">
                          Treinamento
                        </Label>
                        <Select
                          value={skillFilters.training}
                          onValueChange={(value) => setSkillFilters({ ...skillFilters, training: value })}
                        >
                          <SelectTrigger id="filter-training" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="trained">Treinadas</SelectItem>
                            <SelectItem value="untrained">Não Treinadas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Exibindo {getFilteredSkills().length} de {skillsData.length} perícias
                    </div>
                  </Card>

                  <div className="space-y-3">
                    {getFilteredSkills().length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma perícia encontrada com os filtros aplicados.</p>
                      </div>
                    ) : (
                      getFilteredSkills().map((skillData) => {
                        const total = calculateSkillTotal(skillData.name, skillData)
                        const skill = character.pericias?.[skillData.name] || {}
                        const level = getTotalLevel()
                        const halfLevel = Math.floor(level / 2)
                        const selectedAttr = skill.atributo || skillData.attr
                        const attrMod = getAttributeModifier(
                          selectedAttr.toLowerCase() as keyof CharacterType["atributos"],
                        )
                        const armorPenalty = skillData.armorPenalty ? getArmorPenalty() : 0

                        // Calculate training bonus based on character level
                        let trainingBonus = 0
                        const isTrained =
                          skill.treinada === true ||
                          (typeof skill.treinada === "string" && skill.treinada !== "destreinado")
                        if (isTrained) {
                          if (level >= 15) {
                            trainingBonus = 6
                          } else if (level >= 7) {
                            trainingBonus = 4
                          } else {
                            trainingBonus = 2
                          }
                        }

                        const others = skill.outros || 0

                        return (
                          <Card key={`skill-${skillData.name}`} className="p-4 hover:bg-accent/5 transition-colors">
                            <div className="flex flex-col gap-3">
                              {/* Skill name and badges */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <Checkbox
                                    checked={skill.treinada || false}
                                    onCheckedChange={(checked) => {
                                      updateCharacter({
                                        pericias: {
                                          ...character.pericias,
                                          [skillData.name]: {
                                            ...skill,
                                            treinada: checked === true,
                                          },
                                        },
                                      })
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Label className="font-semibold text-base">{skillData.name}</Label>
                                      <div className="flex gap-1">
                                        {skillData.trainedOnly && (
                                          <span
                                            className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium"
                                            title="Somente treinado"
                                          >
                                            Treinada
                                          </span>
                                        )}
                                        {skillData.armorPenalty && (
                                          <span
                                            className="text-xs bg-orange-500/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium"
                                            title="Penalidade de armadura"
                                          >
                                            Armadura
                                          </span>
                                        )}
                                        {skill.atributo && skill.atributo !== skillData.attr && (
                                          <span
                                            className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium"
                                            title="Atributo customizado"
                                          >
                                            Custom
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground">Atributo:</span>
                                      <Select
                                        value={selectedAttr}
                                        onValueChange={(value) => {
                                          updateCharacter({
                                            pericias: {
                                              ...character.pericias,
                                              [skillData.name]: {
                                                ...skill,
                                                atributo: value,
                                              },
                                            },
                                          })
                                        }}
                                      >
                                        <SelectTrigger className="w-24 h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="forca">FOR</SelectItem>
                                          <SelectItem value="destreza">DES</SelectItem>
                                          <SelectItem value="constituicao">CON</SelectItem>
                                          <SelectItem value="inteligencia">INT</SelectItem>
                                          <SelectItem value="sabedoria">SAB</SelectItem>
                                          <SelectItem value="carisma">CAR</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>

                                {/* Total value - prominent display */}
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-20 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-2xl shadow-md">
                                    {total >= 0 ? `+${total}` : total}
                                  </div>
                                  {skillData.trainedOnly && !isTrained && (
                                    <span className="text-xs bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                      Requer Treino
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Calculation breakdown */}
                              <div className="flex items-center gap-2 text-sm font-mono bg-muted/50 p-3 rounded-md flex-wrap">
                                <span className="text-muted-foreground">½ Nível:</span>
                                <span className="font-semibold min-w-[2rem] text-center">{halfLevel}</span>

                                <span className="text-muted-foreground">+</span>
                                <span className="text-muted-foreground">{selectedAttr.toUpperCase()}:</span>
                                <span className="font-semibold min-w-[2rem] text-center">
                                  {attrMod >= 0 ? `+${attrMod}` : attrMod}
                                </span>

                                {isTrained && (
                                  <>
                                    <span className="text-muted-foreground">+</span>
                                    <span className="text-muted-foreground">Treino:</span>
                                    <span className="font-semibold min-w-[2rem] text-center text-green-600 dark:text-green-400">
                                      +{trainingBonus}
                                    </span>
                                  </>
                                )}

                                <span className="text-muted-foreground">+</span>
                                <span className="text-muted-foreground">Outros:</span>
                                <Input
                                  type="number"
                                  className="w-20 h-8 text-center text-sm"
                                  placeholder="0"
                                  value={others || ""}
                                  onChange={(e) => {
                                    const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0
                                    updateCharacter({
                                      pericias: {
                                        ...character.pericias,
                                        [skillData.name]: {
                                          ...skill,
                                          outros: value,
                                        },
                                      },
                                    })
                                  }}
                                />

                                {skillData.armorPenalty && armorPenalty > 0 && (
                                  <>
                                    <span className="text-muted-foreground">-</span>
                                    <span className="text-muted-foreground">Armadura:</span>
                                    <span className="font-semibold min-w-[2rem] text-center text-red-600 dark:text-red-400">
                                      -{armorPenalty}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>

          {/* Abilities Tab */}
          <TabsContent value="abilities" className="mt-6">
            <Card id="abilities" className="section-card">
              <Collapsible open={!collapsedSections["abilities"]} onOpenChange={() => toggleSection("abilities")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <Zap className="w-5 h-5" />
                    Habilidades
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["abilities"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  <div className="space-y-4">
                    {(character.habilidades || []).map((ability, index) => (
                      <Card key={`ability-${index}-${ability.nome || "unnamed"}`} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Input
                              value={ability.nome}
                              onChange={(e) => {
                                const newAbilities = [...(character.habilidades || [])]
                                newAbilities[index] = { ...ability, nome: e.target.value }
                                updateCharacter({ habilidades: newAbilities })
                              }}
                              className="font-semibold text-lg border-none p-0 focus:ring-0"
                              placeholder="Nome da Habilidade"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newAbilities = character.habilidades?.filter((_, i) => i !== index) || []
                                updateCharacter({ habilidades: newAbilities })
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <textarea
                              value={ability.descricao || ""}
                              onChange={(e) => {
                                const newAbilities = [...(character.habilidades || [])]
                                newAbilities[index] = { ...ability, descricao: e.target.value }
                                updateCharacter({ habilidades: newAbilities })
                              }}
                              className="w-full min-h-[100px] p-3 bg-input border border-border rounded-md resize-vertical text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                              placeholder="Descrição detalhada da habilidade..."
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      onClick={() => {
                        const newAbility = {
                          id: generateId(),
                          nome: "Nova Habilidade",
                          descricao: "",
                        }
                        updateCharacter({
                          habilidades: [...(character.habilidades || []), newAbility],
                        })
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Habilidade
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>

          {/* Powers Tab */}
          <TabsContent value="powers" className="mt-6">
            <Card id="powers" className="section-card">
              <Collapsible open={!collapsedSections["powers"]} onOpenChange={() => toggleSection("powers")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <Zap className="w-5 h-5" />
                    Poderes
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["powers"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  <div className="space-y-4">
                    {(character.poderes || []).map((power, index) => (
                      <Card key={`power-${index}-${power.nome || "unnamed"}`} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Input
                                value={power.nome || ""}
                                onChange={(e) => {
                                  const newPowers = [...(character.poderes || [])]
                                  newPowers[index] = { ...power, nome: e.target.value }
                                  updateCharacter({ poderes: newPowers })
                                }}
                                className="font-semibold text-lg border-none p-0 focus:ring-0 flex-1"
                                placeholder="Nome do Poder"
                              />
                              <Select
                                value={power.tipo || ""}
                                onValueChange={(value) => {
                                  const newPowers = [...(character.poderes || [])]
                                  newPowers[index] = { ...power, tipo: value }
                                  updateCharacter({ poderes: newPowers })
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Raça">Raça</SelectItem>
                                  <SelectItem value="Classe">Classe</SelectItem>
                                  <SelectItem value="Geral">Geral</SelectItem>
                                  <SelectItem value="Combate">Combate</SelectItem>
                                  <SelectItem value="Magia">Magia</SelectItem>
                                  <SelectItem value="Destino">Destino</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newPowers = character.poderes?.filter((_, i) => i !== index) || []
                                updateCharacter({ poderes: newPowers })
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <textarea
                              value={power.descricao || ""}
                              onChange={(e) => {
                                const newPowers = [...(character.poderes || [])]
                                newPowers[index] = { ...power, descricao: e.target.value }
                                updateCharacter({ poderes: newPowers })
                              }}
                              className="w-full min-h-[100px] p-3 bg-input border border-border rounded-md resize-vertical text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                              placeholder="Descrição detalhada do poder..."
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      onClick={() => {
                        const newPower = {
                          id: generateId(),
                          nome: "Novo Poder",
                          tipo: "Geral",
                          descricao: "",
                        }
                        updateCharacter({
                          poderes: [...(character.poderes || []), newPower],
                        })
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Poder
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>

          {/* Magic Tab */}
          <TabsContent value="magic" className="mt-6">
            <Card id="magic" className="section-card">
              <Collapsible open={!collapsedSections["magic"]} onOpenChange={() => toggleSection("magic")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <BookOpen className="w-5 h-5" />
                    Magias
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["magic"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  <div className="space-y-6">
                    {["arcana", "divina"].map((type) => (
                      <div key={`magic-type-${type}`} className="space-y-4">
                        <h3 className="text-lg font-semibold capitalize">{type}</h3>
                        {[1, 2, 3, 4, 5].map((circle) => (
                          <div key={`${type}-circle-${circle}`} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">{circle}º Círculo</Label>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const newSpell = {
                                    id: generateId(),
                                    nome: "Nova Magia",
                                    escola: "",
                                    execucao: "",
                                    alcance: "",
                                    descricao: "",
                                    nivel: `${circle}º`,
                                  }
                                  const currentSpells = character.magias?.[type]?.[`${circle}º`] || []
                                  updateCharacter({
                                    magias: {
                                      ...character.magias,
                                      [type]: {
                                        ...character.magias?.[type],
                                        [`${circle}º`]: [...currentSpells, newSpell],
                                      },
                                    },
                                  })
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {(character.magias?.[type]?.[`${circle}º`] || []).map(
                                (spell: any, spellIndex: number) => (
                                  <Card
                                    key={`spell-${type}-${circle}-${spellIndex}-${spell.nome || "unnamed"}`}
                                    className="p-4"
                                  >
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label>Nome</Label>
                                          <Input
                                            value={spell.nome}
                                            onChange={(e) => {
                                              const newSpells = [...(character.magias?.[type]?.[`${circle}º`] || [])]
                                              newSpells[spellIndex] = { ...spell, nome: e.target.value }
                                              updateCharacter({
                                                magias: {
                                                  ...character.magias,
                                                  [type]: {
                                                    ...character.magias?.[type],
                                                    [`${circle}º`]: newSpells,
                                                  },
                                                },
                                              })
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <Label>Escola</Label>
                                          <Input
                                            value={spell.escola}
                                            onChange={(e) => {
                                              const newSpells = [...(character.magias?.[type]?.[`${circle}º`] || [])]
                                              newSpells[spellIndex] = { ...spell, escola: e.target.value }
                                              updateCharacter({
                                                magias: {
                                                  ...character.magias,
                                                  [type]: {
                                                    ...character.magias?.[type],
                                                    [`${circle}º`]: newSpells,
                                                  },
                                                },
                                              })
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                          <Label>Execução</Label>
                                          <Input
                                            value={spell.execucao}
                                            onChange={(e) => {
                                              const newSpells = [...(character.magias?.[type]?.[`${circle}º`] || [])]
                                              newSpells[spellIndex] = { ...spell, execucao: e.target.value }
                                              updateCharacter({
                                                magias: {
                                                  ...character.magias,
                                                  [type]: {
                                                    ...character.magias?.[type],
                                                    [`${circle}º`]: newSpells,
                                                  },
                                                },
                                              })
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <Label>Alcance</Label>
                                          <Input
                                            value={spell.alcance}
                                            onChange={(e) => {
                                              const newSpells = [...(character.magias?.[type]?.[`${circle}º`] || [])]
                                              newSpells[spellIndex] = { ...spell, alcance: e.target.value }
                                              updateCharacter({
                                                magias: {
                                                  ...character.magias,
                                                  [type]: {
                                                    ...character.magias?.[type],
                                                    [`${circle}º`]: newSpells,
                                                  },
                                                },
                                              })
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <Label>Duração</Label>
                                          <Input
                                            value={spell.duracao}
                                            onChange={(e) => {
                                              const newSpells = [...(character.magias?.[type]?.[`${circle}º`] || [])]
                                              newSpells[spellIndex] = { ...spell, duracao: e.target.value }
                                              updateCharacter({
                                                magias: {
                                                  ...character.magias,
                                                  [type]: {
                                                    ...character.magias?.[type],
                                                    [`${circle}º`]: newSpells,
                                                  },
                                                },
                                              })
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Descrição/Efeito</Label>
                                        <textarea
                                          value={spell.descricao || ""}
                                          onChange={(e) => {
                                            const newSpells = [...(character.magias?.[type]?.[`${circle}º`] || [])]
                                            newSpells[spellIndex] = { ...spell, descricao: e.target.value }
                                            updateCharacter({
                                              magias: {
                                                ...character.magias,
                                                [type]: {
                                                  ...character.magias?.[type],
                                                  [`${circle}º`]: newSpells,
                                                },
                                              },
                                            })
                                          }}
                                          className="w-full min-h-[80px] p-2 bg-input border border-border rounded resize-vertical text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                          placeholder="Descrição da magia..."
                                        />
                                      </div>
                                      <div className="flex justify-end">
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            const newSpells =
                                              character.magias?.[type]?.[`${circle}º`]?.filter(
                                                (_: any, i: number) => i !== spellIndex,
                                              ) || []
                                            updateCharacter({
                                              magias: {
                                                ...character.magias,
                                                [type]: {
                                                  ...character.magias?.[type],
                                                  [`${circle}º`]: newSpells,
                                                },
                                              },
                                            })
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="mt-6">
            <Card id="inventory" className="section-card">
              <Collapsible open={!collapsedSections["inventory"]} onOpenChange={() => toggleSection("inventory")}>
                <CollapsibleTrigger className="section-header w-full">
                  <h2 className="section-title">
                    <Package className="w-5 h-5" />
                    Inventário
                  </h2>
                  <ChevronDown
                    className={cn("w-5 h-5 transition-transform", collapsedSections["inventory"] && "rotate-180")}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="section-content">
                  {/* Money Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Dinheiro</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { key: "T$", label: "Tibares" },
                        { key: "PP", label: "Platina" },
                        { key: "PO", label: "Ouro" },
                        { key: "PE", label: "Prata" },
                        { key: "PC", label: "Cobre" },
                      ].map((coin) => (
                        <div key={coin.key} className="space-y-2">
                          <Label>{coin.label}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={character.inventario?.dinheiro?.[coin.key] || 0}
                            onChange={(e) => {
                              const newValue = Number.parseInt(e.target.value) || 0
                              updateCharacter({
                                inventario: {
                                  ...character.inventario,
                                  dinheiro: {
                                    ...character.inventario?.dinheiro,
                                    [coin.key]: newValue,
                                  },
                                },
                              })
                            }}
                            className="form-input"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weapons Section */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Armas</h3>
                      <Button
                        onClick={() => {
                          const newWeapon = {
                            id: generateId(),
                            nome: "Nova Arma",
                            dano: "1d6",
                            critico: "20/x2",
                            alcance: "Corpo a corpo",
                            tipo: "Cortante",
                            peso: 1,
                          }
                          updateCharacter({
                            inventario: {
                              ...character.inventario,
                              armas: [...(character.inventario?.armas || []), newWeapon],
                            },
                          })
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Arma
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {character.inventario?.armas?.map((weapon, index) => (
                        <Card key={`weapon-${weapon.id || index}-${weapon.nome || "unnamed"}`} className="p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Nome</Label>
                                <Input
                                  value={weapon.nome}
                                  onChange={(e) => {
                                    const newWeapons = [...(character.inventario?.armas || [])]
                                    newWeapons[index] = { ...weapon, nome: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armas: newWeapons },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Categoria</Label>
                                <select
                                  value={weapon.categoria || "simples"}
                                  onChange={(e) => {
                                    const newWeapons = [...(character.inventario?.armas || [])]
                                    newWeapons[index] = { ...weapon, categoria: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armas: newWeapons },
                                    })
                                  }}
                                  className="w-full p-2 border rounded-md form-input"
                                >
                                  <option value="simples">Simples</option>
                                  <option value="marcial">Marcial</option>
                                  <option value="exotica">Exótica</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <Label>Dano</Label>
                                <Input
                                  value={weapon.dano}
                                  onChange={(e) => {
                                    const newWeapons = [...(character.inventario?.armas || [])]
                                    newWeapons[index] = { ...weapon, dano: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armas: newWeapons },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Crítico</Label>
                                <Input
                                  value={weapon.critico}
                                  onChange={(e) => {
                                    const newWeapons = [...(character.inventario?.armas || [])]
                                    newWeapons[index] = { ...weapon, critico: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armas: newWeapons },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Alcance</Label>
                                <Input
                                  value={weapon.alcance}
                                  onChange={(e) => {
                                    const newWeapons = [...(character.inventario?.armas || [])]
                                    newWeapons[index] = { ...weapon, alcance: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armas: newWeapons },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Peso</Label>
                                <Input
                                  type="number"
                                  value={weapon.peso}
                                  onChange={(e) => {
                                    const newWeapons = [...(character.inventario?.armas || [])]
                                    newWeapons[index] = { ...weapon, peso: Number.parseFloat(e.target.value) || 0 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armas: newWeapons },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Tipo</Label>
                                <Input
                                  value={weapon.tipo}
                                  onChange={(e) => {
                                    const newWeapons = [...(character.inventario?.armas || [])]
                                    newWeapons[index] = { ...weapon, tipo: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armas: newWeapons },
                                    })
                                  }}
                                  placeholder="Cortante, Perfurante, Contundente..."
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Preço (T$)</Label>
                                <Input
                                  type="number"
                                  value={weapon.preco}
                                  onChange={(e) => {
                                    const newWeapons = [...(character.inventario?.armas || [])]
                                    newWeapons[index] = { ...weapon, preco: Number.parseInt(e.target.value) || 0 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armas: newWeapons },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Propriedades</Label>
                              <Input
                                value={(weapon.propriedades || []).join(", ")}
                                onChange={(e) => {
                                  const newWeapons = [...(character.inventario?.armas || [])]
                                  newWeapons[index] = {
                                    ...weapon,
                                    propriedades: e.target.value
                                      .split(",")
                                      .map((p) => p.trim())
                                      .filter((p) => p),
                                  }
                                  updateCharacter({
                                    inventario: { ...character.inventario, armas: newWeapons },
                                  })
                                }}
                                placeholder="Ágil, Certeira, Duas Mãos..."
                                className="form-input"
                              />
                            </div>
                            <div>
                              <Label>Descrição</Label>
                              <textarea
                                value={weapon.descricao || ""}
                                onChange={(e) => {
                                  const newWeapons = [...(character.inventario?.armas || [])]
                                  newWeapons[index] = { ...weapon, descricao: e.target.value }
                                  updateCharacter({
                                    inventario: { ...character.inventario, armas: newWeapons },
                                  })
                                }}
                                className="w-full min-h-[80px] p-3 bg-input border border-border rounded-md resize-vertical text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                placeholder="Descrição da arma, origem, características especiais..."
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={weapon.proficiencia || false}
                                    onCheckedChange={(checked) => {
                                      const newWeapons = [...(character.inventario?.armas || [])]
                                      newWeapons[index] = { ...weapon, proficiencia: checked === true }
                                      updateCharacter({
                                        inventario: { ...character.inventario, armas: newWeapons },
                                      })
                                    }}
                                  />
                                  <Label>Proficiente</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label>Bônus Ataque:</Label>
                                  <Input
                                    type="number"
                                    value={weapon.bonus_ataque || 0}
                                    onChange={(e) => {
                                      const newWeapons = [...(character.inventario?.armas || [])]
                                      newWeapons[index] = {
                                        ...weapon,
                                        bonus_ataque: Number.parseInt(e.target.value) || 0,
                                      }
                                      updateCharacter({
                                        inventario: { ...character.inventario, armas: newWeapons },
                                      })
                                    }}
                                    className="w-16 form-input"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label>Bônus Dano:</Label>
                                  <Input
                                    type="number"
                                    value={weapon.bonus_dano || 0}
                                    onChange={(e) => {
                                      const newWeapons = [...(character.inventario?.armas || [])]
                                      newWeapons[index] = {
                                        ...weapon,
                                        bonus_dano: Number.parseInt(e.target.value) || 0,
                                      }
                                      updateCharacter({
                                        inventario: { ...character.inventario, armas: newWeapons },
                                      })
                                    }}
                                    className="w-16 form-input"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  const newWeapons = character.inventario?.armas?.filter((_, i) => i !== index) || []
                                  updateCharacter({
                                    inventario: { ...character.inventario, armas: newWeapons },
                                  })
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Armor Section */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Armaduras</h3>
                      <Button
                        onClick={() => {
                          const newArmor = {
                            id: generateId(),
                            nome: "Nova Armadura",
                            ca: 0,
                            penalidade: 0,
                            peso: 1,
                          }
                          updateCharacter({
                            inventario: {
                              ...character.inventario,
                              armaduras: [...(character.inventario?.armaduras || []), newArmor],
                            },
                          })
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Armadura
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {character.inventario?.armaduras?.map((armor, index) => (
                        <Card key={`armor-${armor.id || index}-${armor.nome || "unnamed"}`} className="p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Nome</Label>
                                <Input
                                  value={armor.nome}
                                  onChange={(e) => {
                                    const newArmors = [...(character.inventario?.armaduras || [])]
                                    newArmors[index] = { ...armor, nome: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armaduras: newArmors },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Categoria</Label>
                                <select
                                  value={armor.categoria || "leve"}
                                  onChange={(e) => {
                                    const newArmors = [...(character.inventario?.armaduras || [])]
                                    newArmors[index] = { ...armor, categoria: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armaduras: newArmors },
                                    })
                                  }}
                                  className="w-full p-2 border rounded-md form-input"
                                >
                                  <option value="leve">Leve</option>
                                  <option value="pesada">Pesada</option>
                                  <option value="escudo">Escudo</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <Label>CA</Label>
                                <Input
                                  type="number"
                                  value={armor.ca}
                                  onChange={(e) => {
                                    const newArmors = [...(character.inventario?.armaduras || [])]
                                    newArmors[index] = { ...armor, ca: Number.parseInt(e.target.value) || 0 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armaduras: newArmors },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Penalidade</Label>
                                <Input
                                  type="number"
                                  value={armor.penalidade}
                                  onChange={(e) => {
                                    const newArmors = [...(character.inventario?.armaduras || [])]
                                    newArmors[index] = { ...armor, penalidade: Number.parseInt(e.target.value) || 0 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armaduras: newArmors },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Peso</Label>
                                <Input
                                  type="number"
                                  value={armor.peso}
                                  onChange={(e) => {
                                    const newArmors = [...(character.inventario?.armaduras || [])]
                                    newArmors[index] = { ...armor, peso: Number.parseFloat(e.target.value) || 0 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armaduras: newArmors },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Preço (T$)</Label>
                                <Input
                                  type="number"
                                  value={armor.preco}
                                  onChange={(e) => {
                                    const newArmors = [...(character.inventario?.armaduras || [])]
                                    newArmors[index] = { ...armor, preco: Number.parseInt(e.target.value) || 0 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armaduras: newArmors },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Descrição</Label>
                              <textarea
                                value={armor.descricao || ""}
                                onChange={(e) => {
                                  const newArmors = [...(character.inventario?.armaduras || [])]
                                  newArmors[index] = { ...armor, descricao: e.target.value }
                                  updateCharacter({
                                    inventario: { ...character.inventario, armaduras: newArmors },
                                  })
                                }}
                                className="w-full min-h-[80px] p-3 bg-input border border-border rounded-md resize-vertical text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                placeholder="Descrição da armadura, material, características especiais..."
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={armor.equipada || false}
                                  onCheckedChange={(checked) => {
                                    const newArmors = [...(character.inventario?.armaduras || [])]
                                    newArmors[index] = { ...armor, equipada: checked === true }
                                    updateCharacter({
                                      inventario: { ...character.inventario, armaduras: newArmors },
                                    })
                                  }}
                                />
                                <Label>Equipada</Label>
                              </div>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  const newArmors = character.inventario?.armaduras?.filter((_, i) => i !== index) || []
                                  updateCharacter({
                                    inventario: { ...character.inventario, armaduras: newArmors },
                                  })
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Items Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Itens</h3>
                      <Button
                        onClick={() => {
                          const newItem = {
                            id: generateId(),
                            nome: "Novo Item",
                            quantidade: 1,
                            peso: 0,
                            descricao: "",
                          }
                          updateCharacter({
                            inventario: {
                              ...character.inventario,
                              itens: [...(character.inventario?.itens || []), newItem],
                            },
                          })
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {character.inventario?.itens?.map((item, index) => (
                        <Card key={`item-${item.id || index}-${item.nome || "unnamed"}`} className="p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Nome</Label>
                                <Input
                                  value={item.nome}
                                  onChange={(e) => {
                                    const newItems = [...(character.inventario?.itens || [])]
                                    newItems[index] = { ...item, nome: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, itens: newItems },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Quantidade</Label>
                                <Input
                                  type="number"
                                  value={item.quantidade || 1}
                                  onChange={(e) => {
                                    const newItems = [...(character.inventario?.itens || [])]
                                    newItems[index] = { ...item, quantidade: Number.parseInt(e.target.value) || 1 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, itens: newItems },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Peso (unidade)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={item.peso}
                                  onChange={(e) => {
                                    const newItems = [...(character.inventario?.itens || [])]
                                    newItems[index] = { ...item, peso: Number.parseFloat(e.target.value) || 0 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, itens: newItems },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Preço (T$)</Label>
                                <Input
                                  type="number"
                                  value={item.preco}
                                  onChange={(e) => {
                                    const newItems = [...(character.inventario?.itens || [])]
                                    newItems[index] = { ...item, preco: Number.parseInt(e.target.value) || 0 }
                                    updateCharacter({
                                      inventario: { ...character.inventario, itens: newItems },
                                    })
                                  }}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <Label>Categoria</Label>
                                <Input
                                  value={item.categoria}
                                  onChange={(e) => {
                                    const newItems = [...(character.inventario?.itens || [])]
                                    newItems[index] = { ...item, categoria: e.target.value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, itens: newItems },
                                    })
                                  }}
                                  placeholder="Equipamento, Consumível, Tesouro..."
                                  className="form-input"
                                />
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-3 text-sm">Bônus do Item</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">Bônus Armadura</Label>
                                  <Input
                                    type="number"
                                    value={item.bonus_armadura || 0}
                                    onChange={(e) => {
                                      const newItems = [...(character.inventario?.itens || [])]
                                      newItems[index] = {
                                        ...item,
                                        bonus_armadura: Number.parseInt(e.target.value) || 0,
                                      }
                                      updateCharacter({
                                        inventario: { ...character.inventario, itens: newItems },
                                      })
                                    }}
                                    className="form-input h-8 text-sm"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Bônus Vida</Label>
                                  <Input
                                    type="number"
                                    value={item.bonus_vida || 0}
                                    onChange={(e) => {
                                      const newItems = [...(character.inventario?.itens || [])]
                                      newItems[index] = { ...item, bonus_vida: Number.parseInt(e.target.value) || 0 }
                                      updateCharacter({
                                        inventario: { ...character.inventario, itens: newItems },
                                      })
                                    }}
                                    className="form-input h-8 text-sm"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Bônus Mana</Label>
                                  <Input
                                    type="number"
                                    value={item.bonus_mana || 0}
                                    onChange={(e) => {
                                      const newItems = [...(character.inventario?.itens || [])]
                                      newItems[index] = { ...item, bonus_mana: Number.parseInt(e.target.value) || 0 }
                                      updateCharacter({
                                        inventario: { ...character.inventario, itens: newItems },
                                      })
                                    }}
                                    className="form-input h-8 text-sm"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Bônus Prana</Label>
                                  <Input
                                    type="number"
                                    value={item.bonus_prana || 0}
                                    onChange={(e) => {
                                      const newItems = [...(character.inventario?.itens || [])]
                                      newItems[index] = { ...item, bonus_prana: Number.parseInt(e.target.value) || 0 }
                                      updateCharacter({
                                        inventario: { ...character.inventario, itens: newItems },
                                      })
                                    }}
                                    className="form-input h-8 text-sm"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Bônus Movimento</Label>
                                  <Input
                                    type="number"
                                    value={item.bonus_movimento || 0}
                                    onChange={(e) => {
                                      const newItems = [...(character.inventario?.itens || [])]
                                      newItems[index] = {
                                        ...item,
                                        bonus_movimento: Number.parseInt(e.target.value) || 0,
                                      }
                                      updateCharacter({
                                        inventario: { ...character.inventario, itens: newItems },
                                      })
                                    }}
                                    className="form-input h-8 text-sm"
                                    placeholder="0"
                                  />
                                </div>
                              </div>

                              <div className="mt-3">
                                <Label className="text-xs">Bônus em Atributos</Label>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-1">
                                  {["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma"].map(
                                    (attr) => (
                                      <div key={attr}>
                                        <Label className="text-xs capitalize">{attr.slice(0, 3).toUpperCase()}</Label>
                                        <Input
                                          type="number"
                                          value={item[`bonus_${attr}`] || 0}
                                          onChange={(e) => {
                                            const newItems = [...(character.inventario?.itens || [])]
                                            newItems[index] = {
                                              ...item,
                                              [`bonus_${attr}`]: Number.parseInt(e.target.value) || 0,
                                            }
                                            updateCharacter({
                                              inventario: { ...character.inventario, itens: newItems },
                                            })
                                          }}
                                          className="form-input h-7 text-xs"
                                          placeholder="0"
                                        />
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>

                              <div className="mt-3">
                                <Label className="text-xs">Bônus em Perícia</Label>
                                <Select
                                  value={item.bonus_pericia_nome || "none"}
                                  onValueChange={(value) => {
                                    const newItems = [...(character.inventario?.itens || [])]
                                    newItems[index] = { ...item, bonus_pericia_nome: value === "none" ? "" : value }
                                    updateCharacter({
                                      inventario: { ...character.inventario, itens: newItems },
                                    })
                                  }}
                                >
                                  <SelectTrigger className="w-full h-8 text-sm mt-1">
                                    <SelectValue placeholder="Selecione uma perícia..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Nenhuma</SelectItem>
                                    {skillsData.map((skill) => (
                                      <SelectItem key={skill.name} value={skill.name}>
                                        {skill.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  value={item.bonus_pericia_valor || 0}
                                  onChange={(e) => {
                                    const newItems = [...(character.inventario?.itens || [])]
                                    newItems[index] = {
                                      ...item,
                                      bonus_pericia_valor: Number.parseInt(e.target.value) || 0,
                                    }
                                    updateCharacter({
                                      inventario: { ...character.inventario, itens: newItems },
                                    })
                                  }}
                                  className="form-input h-8 text-sm mt-1"
                                  placeholder="Valor do bônus"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Descrição</Label>
                              <textarea
                                value={item.descricao || ""}
                                onChange={(e) => {
                                  const newItems = [...(character.inventario?.itens || [])]
                                  newItems[index] = { ...item, descricao: e.target.value }
                                  updateCharacter({
                                    inventario: { ...character.inventario, itens: newItems },
                                  })
                                }}
                                className="w-full min-h-[80px] p-3 bg-input border border-border rounded-md resize-vertical text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-input dark:text-foreground dark:border-border"
                                placeholder="Descrição do item, efeitos, uso..."
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  const newItems = character.inventario?.itens?.filter((_, i) => i !== index) || []
                                  updateCharacter({
                                    inventario: { ...character.inventario, itens: newItems },
                                  })
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Edit Modal */}
      {photoEditModal && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Foto do Personagem</h3>

            <div className="mb-4">
              <div
                ref={photoEditCircleRef}
                className="w-48 h-48 mx-auto rounded-full border-2 border-border overflow-hidden bg-muted relative cursor-move"
                onMouseDown={handlePhotoDragStart}
                onTouchStart={handlePhotoDragStart}
                onWheel={handlePhotoWheel}
              >
                {tempPhoto.src ? (
                  <img
                    ref={photoEditRef}
                    src={tempPhoto.src || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-cover select-none"
                    style={{
                      transform: `translate(${tempPhoto.offsetX * 100}%, ${tempPhoto.offsetY * 100}%) scale(${tempPhoto.zoom})`,
                      transformOrigin: "center center",
                    }}
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center mt-2">
                Arraste para posicionar • Scroll para zoom • Clique no botão para trocar
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
                Trocar Foto
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePhotoZoom(0.2)} disabled={tempPhoto.zoom >= 3}>
                Zoom +
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePhotoZoom(-0.2)} disabled={tempPhoto.zoom <= 1}>
                Zoom -
              </Button>
              <Button variant="outline" size="sm" onClick={resetPhotoPosition}>
                Resetar
              </Button>
              <Button variant="outline" size="sm" onClick={removePhoto}>
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setPhotoEditModal(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={savePhotoChanges}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dice Roller Component */}
      <DiceRoller character={character} />
    </div>
  )
}
