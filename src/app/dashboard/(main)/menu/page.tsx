"use client";

import { useState, useEffect, useRef } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { Plus, Trash2, Edit, FolderPlus, X, GripVertical, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  image_alt: string;
  allergens: string[];
  tags: string[];
  keywords: string;
  is_available: boolean;
}

const DIETARY_TAGS = [
  { label: "Vegan", value: "vegan", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Vegetarian", value: "vegetarian", color: "bg-green-50 text-green-600 border-green-200" },
  { label: "Gluten-Free", value: "gluten-free", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "Dairy-Free", value: "dairy-free", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Spicy", value: "spicy", color: "bg-red-100 text-red-700 border-red-200" },
];

export default function MenuPage() {
  const { currentRestaurant } = useRestaurant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Dish form state
  const [showDishForm, setShowDishForm] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [editingCategoryIdForDish, setEditingCategoryIdForDish] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState({
    name: "",
    price: "",
    description: "",
    tags: [] as string[],
    customTag: "",
    image: "" as string,
    imageAlt: "",
    keywords: "",
  });
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentRestaurant) {
      const saved = localStorage.getItem(`menu-categories-${currentRestaurant.id}`);
      if (saved) {
        setCategories(JSON.parse(saved));
      } else {
        setCategories([]);
      }
    }
  }, [currentRestaurant]);

  useEffect(() => {
    if (currentRestaurant) {
      localStorage.setItem(`menu-categories-${currentRestaurant.id}`, JSON.stringify(categories));
    }
  }, [categories, currentRestaurant]);

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName,
      items: [],
    };
    setCategories([...categories, newCategory]);
    setNewCategoryName("");
    setShowAddCategory(false);
  }

  function handleDeleteCategory(categoryId: string) {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
  }

  function handleAddDish(categoryId: string) {
    setEditingDish(null);
    setEditingCategoryIdForDish(categoryId);
    setDishForm({ name: "", price: "", description: "", tags: [], customTag: "", image: "", imageAlt: "", keywords: "" });
    setShowDishForm(true);
  }

  function handleEditDish(item: MenuItem, categoryId: string) {
    setEditingDish(item);
    setEditingCategoryIdForDish(categoryId);
    setDishForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description,
      tags: item.tags,
      customTag: "",
      image: item.image_url || "",
      imageAlt: item.image_alt || "",
      keywords: item.keywords || "",
    });
    setShowDishForm(true);
  }

  function handleSaveDish() {
    if (!editingCategoryIdForDish) return;
    
    const dishData: MenuItem = {
      id: editingDish?.id || `item-${Date.now()}`,
      name: dishForm.name,
      price: parseFloat(dishForm.price) || 0,
      description: dishForm.description,
      image_url: dishForm.image || null,
      image_alt: dishForm.imageAlt,
      allergens: [],
      tags: dishForm.tags,
      keywords: dishForm.keywords,
      is_available: true,
    };

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === editingCategoryIdForDish
          ? editingDish
            ? { ...cat, items: cat.items.map((i) => i.id === editingDish.id ? dishData : i) }
            : { ...cat, items: [...cat.items, dishData] }
          : cat
      )
    );

    setShowDishForm(false);
    setEditingDish(null);
    setEditingCategoryIdForDish(null);
    setDishForm({ name: "", price: "", description: "", tags: [], customTag: "", image: "", imageAlt: "", keywords: "" });
  }

  function handleDeleteDish(item: MenuItem, categoryId: string) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((i) => i.id !== item.id) }
          : cat
      )
    );
  }

  function toggleTag(tagValue: string) {
    setDishForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagValue)
        ? prev.tags.filter((t) => t !== tagValue)
        : [...prev.tags, tagValue],
    }));
  }

  function addCustomTag() {
    if (!dishForm.customTag.trim()) return;
    setDishForm((prev) => ({
      ...prev,
      tags: [...prev.tags, dishForm.customTag.trim()],
      customTag: "",
    }));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDishForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

  function handleImageUploadClick() {
    imageInputRef.current?.click();
  }

  function handleRemoveImage() {
    setDishForm((prev) => ({ ...prev, image: "", imageAlt: "" }));
  }

  if (!currentRestaurant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your restaurant menu categories and dishes</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddCategory(!showAddCategory)}
          className="gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {showAddCategory && (
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <input
            type="text"
            placeholder="Category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleAddCategory}>
              Add Category
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddCategory(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <FolderPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No categories yet. Add your first category to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                  <span className="text-sm text-gray-500">({category.items.length} dishes)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddDish(category.id)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Dish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Dishes List */}
              <div className="p-4">
                {category.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No dishes in this category yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move shrink-0" />
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.image_alt || item.name}
                            className="w-16 h-16 object-cover rounded-lg shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <p className="font-semibold text-gray-900">€{item.price.toFixed(2)}</p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditDish(item, category.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDish(item, category.id)}
                              className="h-8 w-8 p-0 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dish Editor Modal */}
      {showDishForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-[calc(100%-2rem)] max-w-lg mx-auto max-h-[85vh] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col">
            {/* Fixed Header */}
            <div className="p-5 border-b border-gray-50 bg-white rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingDish ? "Edit Dish" : "Add New Dish"}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDishForm(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dish Photo</label>
                <div className="flex flex-col items-start gap-4">
                  {dishForm.image ? (
                    <div className="relative shrink-0 mx-auto">
                      <img
                        src={dishForm.image}
                        alt="Dish preview"
                        className="w-32 h-32 object-cover rounded-xl border border-gray-100"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100 mx-auto">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="w-full space-y-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleImageUploadClick}
                      className="gap-2 w-full"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image from Files or Photo Library
                    </Button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Alt-Text for SEO/Accessibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Alt Text (SEO/Accessibility)</label>
                <input
                  type="text"
                  placeholder="e.g., Grilled salmon with lemon butter sauce"
                  value={dishForm.imageAlt}
                  onChange={(e) => setDishForm({ ...dishForm, imageAlt: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Describe the image for screen readers and SEO</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g., Grilled Salmon"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    className="w-full h-10 pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Ingredients, preparation notes, etc."
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DIETARY_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleTag(tag.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        dishForm.tags.includes(tag.value)
                          ? tag.color
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Custom tag (e.g., Keto)"
                    value={dishForm.customTag}
                    onChange={(e) => setDishForm({ ...dishForm, customTag: e.target.value })}
                    onKeyPress={(e) => e.key === "Enter" && addCustomTag()}
                    className="flex-1 h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Button size="sm" variant="outline" onClick={addCustomTag}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Keywords for SEO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
                <input
                  type="text"
                  placeholder="e.g., salmon, grilled, healthy, dinner"
                  value={dishForm.keywords}
                  onChange={(e) => setDishForm({ ...dishForm, keywords: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated keywords to help your menu rank in search results</p>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDishForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDish}>
                {editingDish ? "Update Dish" : "Add Dish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
