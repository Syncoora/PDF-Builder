"use client";

import type React from "react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  Plus,
  Minus,
  Trash2,
  Type,
  Upload,
  Check,
  Braces,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import CharacterCount from "@tiptap/extension-character-count";
import FontFamily from "@tiptap/extension-font-family";
import UnderlineExtension from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";
import { Checkbox } from "@/components/ui/checkbox";

// Create a custom font size extension
const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}${
                  /^\d+$/.test(attributes.fontSize) ? "px" : ""
                }`,
              };
            },
          },
        },
      },
    ];
  },

  /* Commenting out addCommands to fix build error
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run()
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).run()
        },
    }
  },
  */
});

// Add this CSS at the top of your editor styles
const tableStyles = `
.ProseMirror table {
  border-collapse: collapse;
  margin: 0;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
}

.ProseMirror table td,
.ProseMirror table th {
  border: 2px solid #ddd;
  box-sizing: border-box;
  min-width: 1em;
  padding: 8px;
  position: relative;
  vertical-align: top;
}

.ProseMirror table th {
  background-color: #f1f3f5;
  font-weight: bold;
  text-align: left;
}

.ProseMirror table .selectedCell:after {
  background: rgba(200, 200, 255, 0.4);
  content: "";
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}
`;

interface ImageUploadDialogProps {
  onImageSelected: (imageUrl: string) => void;
}

function ImageUploadDialog({ onImageSelected }: ImageUploadDialogProps) {
  const [imageUrl, setImageUrl] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert the file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImageSelected(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl) {
      onImageSelected(imageUrl);
      setImageUrl("");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <div className="grid w-full gap-4">
              <div className="grid w-full items-center gap-4">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="url" className="mt-4">
            <form onSubmit={handleUrlSubmit} className="grid gap-4">
              <div className="grid w-full items-center gap-4">
                <Input
                  type="url"
                  placeholder="Enter image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <Button type="submit">Insert Image</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Color picker component
function ColorPicker({
  onChange,
  defaultColor = "#000000",
  onApply,
}: {
  onChange: (color: string) => void;
  defaultColor?: string;
  onApply?: (color: string) => void;
}) {
  const [color, setColor] = useState(defaultColor);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    onChange(newColor);
  };

  const handleApply = () => {
    if (onApply) {
      onApply(color);
    }
  };

  // Use mousedown instead of click to prevent the popover from closing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md border border-muted"
          style={{ backgroundColor: color }}
          onMouseDown={handleMouseDown}
        />
        <Input
          type="text"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="w-24 font-mono text-xs"
          onMouseDown={handleMouseDown}
        />
      </div>
      <input
        type="color"
        value={color}
        onChange={handleColorChange}
        className="w-full h-8 cursor-pointer"
        onMouseDown={handleMouseDown}
      />
      {onApply && (
        <Button size="sm" onClick={handleApply} className="mt-2">
          <Check className="h-4 w-4 mr-2" />
          Apply Color
        </Button>
      )}
    </div>
  );
}

// Update the EditorProps interface to include sampleData
interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onUpdateMeta: (meta: any) => void;
  variables: string[];
  sampleData: Record<string, any>;
}

// Add a ref type for the editor
export interface EditorRef {
  getContent: () => string;
}

// Update the Editor component to expose a method to get current content
const Editor = forwardRef<EditorRef, EditorProps>(
  ({ content, onChange, onUpdateMeta, variables, sampleData }, ref) => {
    const [fontFamilies, setFontFamilies] = useState([
      { value: "Arial", label: "Arial" },
      { value: "Times New Roman", label: "Times New Roman" },
      { value: "Georgia", label: "Georgia" },
      { value: "Courier New", label: "Courier New" },
    ]);

    const [fontSizes, setFontSizes] = useState([
      "8",
      "9",
      "10",
      "11",
      "12",
      "14",
      "16",
      "18",
      "20",
      "24",
      "26",
      "28",
      "36",
      "48",
      "72",
    ]);

    const [colorPresets, setColorPresets] = useState([
      { label: "Black", value: "#000000" },
      { label: "Gray", value: "#808080" },
      { label: "Silver", value: "#C0C0C0" },
      { label: "White", value: "#FFFFFF" },
      { label: "Maroon", value: "#800000" },
      { label: "Red", value: "#FF0000" },
      { label: "Purple", value: "#800080" },
      { label: "Fuchsia", value: "#FF00FF" },
      { label: "Green", value: "#008000" },
      { label: "Lime", value: "#00FF00" },
      { label: "Olive", value: "#808000" },
      { label: "Yellow", value: "#FFFF00" },
      { label: "Navy", value: "#000080" },
      { label: "Blue", value: "#0000FF" },
      { label: "Teal", value: "#008080" },
      { label: "Aqua", value: "#00FFFF" },
    ]);

    // State for color picker
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState("#000000");

    // Add these state variables for the table settings
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [tableWithHeaderRow, setTableWithHeaderRow] = useState(true);
    const [tableWithBorders, setTableWithBorders] = useState(true);

    // Create a new editor instance when content changes
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          bulletList: {
            keepMarks: true,
            keepAttributes: true,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: true,
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        TextAlign.configure({
          types: ["heading", "paragraph"],
          defaultAlignment: "left",
        }),
        TextStyle,
        Color.configure({ types: [TextStyle.name] }),
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        CharacterCount,
        FontFamily.configure({
          types: ["textStyle"],
        }),
        UnderlineExtension,
        // Use our updated font size extension
        FontSize.configure({
          types: ["textStyle"],
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange(html);

        // Also update the preview immediately
        const previewElement = document.querySelector(".table-container");
        if (previewElement) {
          // Process variables in content
          const processedContent = html.replace(/\${(\w+)}/g, (match, key) => {
            const value = sampleData[key];
            return value != null ? String(value) : match;
          });
          previewElement.innerHTML = processedContent;
        }

        onUpdateMeta({
          wordCount: editor.storage?.characterCount?.words?.() ?? 0,
          charCount: editor.storage?.characterCount?.characters?.() ?? 0,
        });
      },
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getContent: () => (editor ? editor.getHTML() : content),
    }));

    // Update editor content when content prop changes
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    useEffect(() => {
      const style = document.createElement("style");
      style.textContent = tableStyles;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }, []);

    // Update current color when editor selection changes
    useEffect(() => {
      if (editor) {
        const color = editor.getAttributes("textStyle").color;
        if (color) {
          setCurrentColor(color);
        }
      }
    }, [editor]);

    // Add null check at the beginning
    if (!editor) {
      return null;
    }

    // Add this helper function for font size commands
    const setFontSize = (size: string) => {
      // Use a more direct approach instead of the custom command
      editor?.chain().focus().setMark("textStyle", { fontSize: size }).run();
    };

    // Modified insertTable function to store border preference as a data attribute
    const insertTable = (
      rows: number,
      cols: number,
      withHeaderRow: boolean,
      withBorders: boolean
    ) => {
      editor?.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();

      // Add a data attribute to the table to store the border preference
      setTimeout(() => {
        const table = editor?.view.dom.querySelector("table:last-child");
        if (table) {
          const tableId = `table-${Date.now()}`;
          table.setAttribute("data-table-id", tableId);
          table.setAttribute("data-borders", withBorders ? "true" : "false");
        }
      }, 0);
    };

    const addColumnBefore = () => {
      editor?.chain().focus().addColumnBefore().run();
    };

    const addColumnAfter = () => {
      editor?.chain().focus().addColumnAfter().run();
    };

    const deleteColumn = () => {
      editor?.chain().focus().deleteColumn().run();
    };

    const addRowBefore = () => {
      editor?.chain().focus().addRowBefore().run();
    };

    const addRowAfter = () => {
      editor?.chain().focus().addRowAfter().run();
    };

    const deleteRow = () => {
      editor?.chain().focus().deleteRow().run();
    };

    const deleteTable = () => {
      editor?.chain().focus().deleteTable().run();
    };

    const handleImageSelected = (imageUrl: string) => {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
    };

    // Add a function to insert variables
    const insertVariable = (variable: string) => {
      editor?.chain().focus().insertContent(`\${${variable}}`).run();
    };

    // Function to apply color and close popover
    const applyColor = (color: string) => {
      editor?.chain().focus().setColor(color).run();
      setColorPickerOpen(false);
    };

    // Function to handle preset color selection
    const handlePresetColorSelect = (color: string) => {
      editor?.chain().focus().setColor(color).run();
      setColorPickerOpen(false);
    };

    // Function to toggle border preference for the current table
    const toggleTableBorders = (showBorders: boolean) => {
      const table =
        editor?.view.dom.querySelector("table.ProseMirror-selectedCell") ||
        editor?.view.dom.querySelector("table:has(.ProseMirror-selectedCell)");

      if (table) {
        table.setAttribute("data-borders", showBorders ? "true" : "false");
      }
    };

    // Function to get the current table's border preference
    const getTableBorderPreference = () => {
      const table =
        editor?.view.dom.querySelector("table.ProseMirror-selectedCell") ||
        editor?.view.dom.querySelector("table:has(.ProseMirror-selectedCell)");

      if (table) {
        return table.getAttribute("data-borders") !== "false";
      }
      return true;
    };

    return (
      <div className="space-y-4">
        {variables.length > 0 && (
          <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                >
                  <Braces className="h-3 w-3" />
                  <span className="sr-only">View available variables</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h3 className="font-semibold">Available Variables</h3>
                  <div className="space-y-2">
                    {variables.map((variable) => (
                      <div key={variable} className="text-sm grid gap-1">
                        <code className="px-2 py-1 bg-muted rounded-md">
                          ${"{" + variable + "}"}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          Current value: {String(sampleData[variable] || "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            Use ${"{variable}"} syntax to insert dynamic values. Available
            variables: {variables.join(", ")}
          </div>
        )}
        <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/50">
          {/* Font Controls */}
          <Select
            onValueChange={(value) =>
              editor?.chain().focus().setFontFamily(value).run()
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Font Family" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFontSize(value)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Update the Text Color control with color picker */}
          <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Type className="h-4 w-4" />
                <div
                  className="absolute bottom-0 left-1/2 h-1 w-4 -translate-x-1/2 rounded-t-sm"
                  style={{
                    backgroundColor:
                      editor?.getAttributes("textStyle").color || "#000000",
                  }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Tabs defaultValue="presets">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                  <TabsTrigger value="picker">Custom</TabsTrigger>
                </TabsList>
                <TabsContent value="presets" className="mt-2">
                  <div className="grid grid-cols-5 gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color.value}
                        className="relative h-8 w-8 rounded-md border border-muted hover:scale-105 transition"
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent popover from closing
                          handlePresetColorSelect(color.value);
                        }}
                      >
                        {editor?.isActive("textStyle", {
                          color: color.value,
                        }) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="picker" className="mt-2">
                  <div className="space-y-2">
                    <Label>Custom Color</Label>
                    <ColorPicker
                      defaultColor={
                        editor?.getAttributes("textStyle").color || "#000000"
                      }
                      onChange={setCurrentColor}
                      onApply={applyColor}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          {/* Text Formatting */}
          <Toggle
            pressed={editor?.isActive("bold") ?? false}
            onPressedChange={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("italic") ?? false}
            onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("underline") ?? false}
            onPressedChange={() =>
              editor?.chain().focus().toggleUnderline().run()
            }
          >
            <Underline className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("strike") ?? false}
            onPressedChange={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("code") ?? false}
            onPressedChange={() => editor?.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </Toggle>

          {/* Lists */}
          <Toggle
            pressed={editor?.isActive("bulletList") ?? false}
            onPressedChange={() =>
              editor?.chain().focus().toggleBulletList().run()
            }
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("orderedList") ?? false}
            onPressedChange={() =>
              editor?.chain().focus().toggleOrderedList().run()
            }
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>

          {/* Alignment */}
          <Toggle
            pressed={editor?.isActive({ textAlign: "left" }) ?? false}
            onPressedChange={() =>
              editor?.chain().focus().setTextAlign("left").run()
            }
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive({ textAlign: "center" }) ?? false}
            onPressedChange={() =>
              editor?.chain().focus().setTextAlign("center").run()
            }
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive({ textAlign: "right" }) ?? false}
            onPressedChange={() =>
              editor?.chain().focus().setTextAlign("right").run()
            }
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>

          {/* Table Insert Dialog */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <TableIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              {!editor.isActive("table") ? (
                <div className="space-y-4">
                  <h4 className="font-medium">Insert Table</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="rows">Rows</Label>
                      <Input
                        id="rows"
                        type="number"
                        value={tableRows}
                        onChange={(e) =>
                          setTableRows(
                            Math.max(1, Number.parseInt(e.target.value) || 1)
                          )
                        }
                        min="1"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="columns">Columns</Label>
                      <Input
                        id="columns"
                        type="number"
                        value={tableCols}
                        onChange={(e) =>
                          setTableCols(
                            Math.max(1, Number.parseInt(e.target.value) || 1)
                          )
                        }
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="header-row"
                      checked={tableWithHeaderRow}
                      onCheckedChange={(checked) =>
                        setTableWithHeaderRow(checked as boolean)
                      }
                    />
                    <Label htmlFor="header-row">Include header row</Label>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="table-borders"
                      checked={tableWithBorders}
                      onCheckedChange={(checked) =>
                        setTableWithBorders(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="table-borders"
                      className="flex items-center gap-1"
                    >
                      Show borders in exported document
                      <span className="text-xs text-muted-foreground">
                        (borders always show in editor)
                      </span>
                    </Label>
                  </div>
                  <Button
                    onClick={() => {
                      insertTable(
                        tableRows,
                        tableCols,
                        tableWithHeaderRow,
                        tableWithBorders
                      );
                    }}
                    className="w-full"
                  >
                    Insert Table
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium">Table Options</h4>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={addColumnBefore}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Col Before
                      </Button>
                      <Button
                        onClick={addColumnAfter}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Col After
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={addRowBefore}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Row Before
                      </Button>
                      <Button onClick={addRowAfter} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Row After
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={deleteColumn}
                        variant="outline"
                        size="sm"
                      >
                        <Minus className="h-4 w-4 mr-1" /> Column
                      </Button>
                      <Button onClick={deleteRow} variant="outline" size="sm">
                        <Minus className="h-4 w-4 mr-1" /> Row
                      </Button>
                    </div>
                    <Select
                      onValueChange={(value) => {
                        const style = document.createElement("style");
                        style.textContent = `
                        .ProseMirror table td,
                        .ProseMirror table th {
                          border-width: ${value};
                        }
                      `;
                        document.head.appendChild(style);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Border width" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1px">Thin</SelectItem>
                        <SelectItem value="2px">Medium</SelectItem>
                        <SelectItem value="3px">Thick</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={deleteTable}
                      variant="outline"
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete Table
                    </Button>
                  </div>
                  {/* Add a toggle borders option in the table options section */}
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="toggle-borders"
                      checked={getTableBorderPreference()}
                      onCheckedChange={(checked) =>
                        toggleTableBorders(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="toggle-borders"
                      className="flex items-center gap-1"
                    >
                      Show borders in exported document
                      <span className="text-xs text-muted-foreground">
                        (borders always show in editor)
                      </span>
                    </Label>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Replace the old image button with the new dialog */}
          <ImageUploadDialog onImageSelected={handleImageSelected} />

          {/* Add Variables Dropdown */}
          {variables.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Insert Variable
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="grid gap-1">
                  {variables.map((variable) => (
                    <Button
                      key={variable}
                      variant="ghost"
                      className="justify-start font-mono text-sm"
                      onClick={() => insertVariable(variable)}
                    >
                      ${"{" + variable + "}"}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {!editor ? null : (
          <EditorContent
            editor={editor}
            className="min-h-[400px] border rounded-lg p-4 prose max-w-none dark:prose-invert"
          />
        )}
      </div>
    );
  }
);

Editor.displayName = "Editor";

export default Editor;
