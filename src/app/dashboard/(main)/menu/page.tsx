"use client";

import { useState, useEffect, useRef } from "react";
import { fetchDemoRestaurant, fetchRestaurantBySlug } from "@/lib/data";
import { Plus, Trash2, Edit, FolderPlus, X, GripVertical, Upload, Camera, Wand2 } from "lucide-react";
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
  allergens: string[];
  tags: string[];
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
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Dish form state
  const [showDishForm, setShowDishForm] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishForm, setDishForm] = useState({
    name: "",
    price: "",
    description: "",
    tags: [] as string[],
    customTag: "",
    image: "" as string,
  });
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const r = await fetchDemoRestaurant();
      const f = await fetchRestaurantBySlug(r.slug);
      setRestaurant(r);
      const saved = localStorage.getItem(`menu-categories-${r.id}`);
      if (saved) {
        setCategories(JSON.parse(saved));
      } else {
        setCategories([]);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (restaurant) {
      localStorage.setItem(`menu-categories-${restaurant.id}`, JSON.stringify(categories));
    }
  }, [categories, restaurant]);

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
    setSelectedCategoryId(newCategory.id);
  }

  function handleDeleteCategory(categoryId: string) {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    }
  }

  function handleAddDish() {
    setEditingDish(null);
    setDishForm({ name: "", price: "", description: "", tags: [], customTag: "", image: "" });
    setShowDishForm(true);
  }

  function handleEditDish(item: MenuItem) {
    setEditingDish(item);
    setDishForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description,
      tags: item.tags,
      customTag: "",
      image: item.image_url || "",
    });
    setShowDishForm(true);
  }

  function handleSaveDish() {
    if (!selectedCategoryId) return;
    
    const dishData: MenuItem = {
      id: editingDish?.id || `item-${Date.now()}`,
      name: dishForm.name,
      price: parseFloat(dishForm.price) || 0,
      description: dishForm.description,
      image_url: dishForm.image || null,
      allergens: [],
      tags: dishForm.tags,
      is_available: true,
    };

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === selectedCategoryId
          ? editingDish
            ? { ...cat, items: cat.items.map((i) => i.id === editingDish.id ? dishData : i) }
            : { ...cat, items: [...cat.items, dishData] }
          : cat
      )
    );

    setShowDishForm(false);
    setEditingDish(null);
    setDishForm({ name: "", price: "", description: "", tags: [], customTag: "", image: "" });
  }

  function handleDeleteDish(item: MenuItem) {
    if (!selectedCategoryId) return;
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === selectedCategoryId
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
    setDishForm((prev) => ({ ...prev, image: "" }));
  }

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

  if (!restaurant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your restaurant menu categories and dishes</p>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* Left Column - Categories */}
        <div className="w-full md:col-span-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {showAddCategory && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleAddCategory} className="flex-1">
                    Add Category
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddCategory(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile: Horizontal scrolling row */}
            <div className="md:hidden">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No categories yet</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        "flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition-all whitespace-nowrap",
                        selectedCategoryId === cat.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {cat.name}
                      <span className="ml-2 text-xs text-gray-400">({cat.items.length})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: Vertical list */}
            <div className="hidden md:block space-y-2 max-h-96 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No categories yet</p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer group",
                      selectedCategoryId === cat.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="flex-1 text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-gray-500">{cat.items.length}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Dishes */}
        <div className="w-full md:col-span-8">
          <div className="rounded-xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
            {!selectedCategory ? (
              <div className="text-center py-12">
                <FolderPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a category to manage dishes</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedCategory.name}</h2>
                    <p className="text-sm text-gray-500">{selectedCategory.items.length} dishes</p>
                  </div>
                  <Button size="sm" onClick={handleAddDish} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Dish
                  </Button>
                </div>

                {selectedCategory.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No dishes in this category yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCategory.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-sm text-gray-500 truncate">{item.description}</p>
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.map((tag) => (
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
                              onClick={() => handleEditDish(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDish(item)}
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
              </>
            )}
          </div>
        </div>
      </div>

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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => alert("Premium Feature: AI Background Removal is enabled on production subscription tiers.")}
                      className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 w-full"
                    >
                      <Wand2 className="h-4 w-4" />
                      Magic Background Remover (AI)
                    </Button>
                  </div>
                </div>
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
