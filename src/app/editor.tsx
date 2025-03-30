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
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import CharacterCount from "@tiptap/extension-character-count";
import FontFamily from "@tiptap/extension-font-family";
import UnderlineExtension from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";

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

// Update the EditorProps interface
interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onUpdateMeta: (meta: any) => void;
  variables: string[];
}

// Add a ref type for the editor
export interface EditorRef {
  getContent: () => string;
}

// Update the Editor component to expose a method to get current content
const Editor = forwardRef<EditorRef, EditorProps>(
  ({ content, onChange, onUpdateMeta, variables }, ref) => {
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
            const sampleData = {
              name: "test name",
              quantity: 3,
              price: 10,
              orderId: "ORD-123",
              date: "2024-02-21",
              customerEmail: "test@example.com",
            };
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

    // Add null check at the beginning
    if (!editor) {
      return null;
    }

    // Add this helper function for font size commands
    const setFontSize = (size: string) => {
      // Use a more direct approach instead of the custom command
      editor?.chain().focus().setMark("textStyle", { fontSize: size }).run();
    };

    const insertTable = () => {
      editor
        ?.chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
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

    // Add a helper text above the editor
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-2">
          Use ${"{variable}"} syntax to insert dynamic values. Available
          variables: name, quantity, price
        </div>
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

          {/* Update the Text Color control */}
          <Popover>
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
            <PopoverContent className="w-64">
              <div className="grid grid-cols-5 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    className="relative h-8 w-8 rounded-md border border-muted hover:scale-105 transition"
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                    onClick={() => {
                      editor?.chain().focus().setColor(color.value).run();
                    }}
                  >
                    {editor?.isActive("textStyle", { color: color.value }) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
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

          {/* Update the Table Controls section */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <TableIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={insertTable} variant="outline" size="sm">
                  Insert Table
                </Button>
                <Button onClick={deleteTable} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> Table
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={addColumnBefore} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Col Before
                </Button>
                <Button onClick={addColumnAfter} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Col After
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={addRowBefore} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Row Before
                </Button>
                <Button onClick={addRowAfter} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Row After
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={deleteColumn} variant="outline" size="sm">
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
            </PopoverContent>
          </Popover>

          {/* Replace the old image button with the new dialog */}
          <ImageUploadDialog onImageSelected={handleImageSelected} />

          {/* Add Variables Dropdown */}
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
