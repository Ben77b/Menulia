"use client";

import { useState, useEffect, useRef } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { Plus, Trash2, Edit, FolderPlus, X, GripVertical, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  fetchMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuDish,
  updateMenuDish,
  deleteMenuDish,
} from "@/lib/menu-db";
import { formatSupabaseError } from "@/lib/auth/errors";

export const dynamic = 'force-dynamic';

interface Category {
  id: string;
  name: string;
  layout_type: 'stacked' | 'carousel';
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


export default function MenuPage() {
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categorySaveError, setCategorySaveError] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryLayoutType, setNewCategoryLayoutType] = useState<'stacked' | 'carousel'>('stacked');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [draggedDishIndex, setDraggedDishIndex] = useState<number | null>(null);
  const [draggedDishCategoryId, setDraggedDishCategoryId] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newGlobalTag, setNewGlobalTag] = useState("");
  
  // Dish form state
  const [showDishForm, setShowDishForm] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [editingCategoryIdForDish, setEditingCategoryIdForDish] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState({
    name: "",
    price: "",
    description: "",
    image: "" as string,
    tags: [] as string[],
    customTag: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File): Promise<string | null> {
    if (!currentRestaurant) return null;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPEG, or WebP image');
      return null;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Please upload an image smaller than 5MB');
      return null;
    }

    try {
      setUploadingImage(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentRestaurant.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      setDishForm({ ...dishForm, image: imageUrl });
    }
  }

  async function loadMenuData() {
    if (!currentRestaurant?.id) return;

    setIsLoading(true);

    try {
      const categoriesWithItems = await fetchMenuCategories(currentRestaurant.id);

      setCategories(
        categoriesWithItems.map((category) => ({
          id: category.id,
          name: category.name,
          layout_type: category.layout_type,
          items: category.items.map((dish) => ({
            id: dish.id,
            name: dish.name,
            description: dish.description,
            price: dish.price,
            image_url: dish.image_url,
            image_alt: "",
            allergens: [],
            tags: dish.tags,
            keywords: "",
            is_available: dish.is_available,
          })),
        }))
      );

      const savedTags = localStorage.getItem(`custom-tags-${currentRestaurant.id}`);
      setCustomTags(savedTags ? JSON.parse(savedTags) : []);
    } catch (error) {
      console.error("Error loading menu data:", error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadMenuData();
    }
  }, [currentRestaurant?.id]);

  useEffect(() => {
    if (currentRestaurant?.id) {
      localStorage.setItem(`custom-tags-${currentRestaurant.id}`, JSON.stringify(customTags));
    }
  }, [customTags, currentRestaurant?.id]);

  async function handleAddCategory() {
    if (!newCategoryName.trim() || !currentRestaurant?.id) return;

    setCategorySaveError(null);
    setIsSaving(true);

    try {
      const created = await createMenuCategory(newCategoryName, currentRestaurant.id);

      setCategories((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          layout_type: created.layout_type,
          items: [],
        },
      ]);

      setNewCategoryName("");
      setNewCategoryLayoutType("stacked");
      setShowAddCategory(false);
      await refreshRestaurants();
    } catch (error) {
      console.error("Error creating category:", error);
      setCategorySaveError(formatSupabaseError(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm("Delete this category and all of its dishes?")) return;

    setIsSaving(true);

    try {
      await deleteMenuCategory(categoryId);
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      await refreshRestaurants();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCategoryLayoutTypeChange(
    categoryId: string,
    layoutType: "stacked" | "carousel"
  ) {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, layout_type: layoutType } : cat))
    );

    try {
      await updateMenuCategory(categoryId, { layout_type: layoutType });
      await refreshRestaurants();
    } catch (error) {
      console.error("Error updating category layout:", error);
      await loadMenuData();
      alert("Failed to update category layout. Please try again.");
    }
  }

  function handleAddDish(categoryId: string) {
    setEditingDish(null);
    setEditingCategoryIdForDish(categoryId);
    setDishForm({ name: "", price: "", description: "", image: "", tags: [], customTag: "" });
    setShowDishForm(true);
  }

  function handleEditDish(item: MenuItem, categoryId: string) {
    setEditingDish(item);
    setEditingCategoryIdForDish(categoryId);
    setDishForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description,
      image: item.image_url || "",
      tags: item.tags,
      customTag: "",
    });
    setShowDishForm(true);
  }

  async function handleSaveDish() {
    if (!editingCategoryIdForDish || !dishForm.name.trim()) return;

    setIsSaving(true);

    const dishPayload = {
      name: dishForm.name,
      description: dishForm.description,
      price: parseFloat(dishForm.price) || 0,
      image_url: dishForm.image || null,
      tags: dishForm.tags,
    };

    try {
      if (editingDish) {
        await updateMenuDish(
          editingDish.id,
          dishForm.name,
          dishForm.description,
          parseFloat(dishForm.price) || 0,
          dishForm.image || null,
          dishForm.tags
        );

        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategoryIdForDish
              ? {
                  ...cat,
                  items: cat.items.map((item) =>
                    item.id === editingDish.id
                      ? {
                          ...item,
                          ...dishPayload,
                          image_alt: item.image_alt,
                          allergens: item.allergens,
                          keywords: item.keywords,
                          is_available: item.is_available,
                        }
                      : item
                  ),
                }
              : cat
          )
        );
      } else {
        const created = await createMenuDish(
          editingCategoryIdForDish,
          dishForm.name,
          dishForm.description,
          parseFloat(dishForm.price) || 0,
          dishForm.image || null,
          dishForm.tags
        );

        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategoryIdForDish
              ? {
                  ...cat,
                  items: [
                    ...cat.items,
                    {
                      id: created.id,
                      name: created.name,
                      description: created.description,
                      price: created.price,
                      image_url: created.image_url,
                      image_alt: "",
                      allergens: [],
                      tags: created.tags,
                      keywords: "",
                      is_available: created.is_available,
                    },
                  ],
                }
              : cat
          )
        );
      }

      setShowDishForm(false);
      setEditingDish(null);
      setEditingCategoryIdForDish(null);
      setDishForm({ name: "", price: "", description: "", image: "", tags: [], customTag: "" });
      await refreshRestaurants();
    } catch (error) {
      console.error("Error saving dish:", error);
      alert("Failed to save dish. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteDish(item: MenuItem, categoryId: string) {
    if (!confirm("Delete this dish?")) return;

    setIsSaving(true);

    try {
      await deleteMenuDish(item.id);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, items: cat.items.filter((i) => i.id !== item.id) } : cat
        )
      );
      await refreshRestaurants();
    } catch (error) {
      console.error("Error deleting dish:", error);
      alert("Failed to delete dish. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }


  function handleImageUploadClick() {
    imageInputRef.current?.click();
  }

  function handleRemoveImage() {
    setDishForm((prev) => ({ ...prev, image: "" }));
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
    const newTag = dishForm.customTag.trim();
    
    // Prevent duplicate tags in the dish
    if (dishForm.tags.includes(newTag)) {
      setDishForm((prev) => ({ ...prev, customTag: "" }));
      return;
    }
    
    setDishForm((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag],
      customTag: "",
    }));
    
    // Add to custom tags if not already there
    if (!customTags.includes(newTag)) {
      setCustomTags((prev) => [...prev, newTag]);
    }
  }

  function deleteCustomTag(tag: string) {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
    // Also remove from all dishes
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({
          ...item,
          tags: item.tags.filter((t) => t !== tag),
        })),
      }))
    );
  }

  function addGlobalTag() {
    if (!newGlobalTag.trim()) return;
    const tag = newGlobalTag.trim();
    
    // Prevent duplicate tags
    if (customTags.includes(tag)) {
      setNewGlobalTag("");
      return;
    }
    
    setCustomTags((prev) => [...prev, tag]);
    setNewGlobalTag("");
  }

  // Drag and drop handlers for categories
  function handleCategoryDragStart(index: number) {
    setDraggedCategoryIndex(index);
  }

  function handleCategoryDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleCategoryDrop(index: number) {
    if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;

    const newCategories = [...categories];
    const [draggedCategory] = newCategories.splice(draggedCategoryIndex, 1);
    newCategories.splice(index, 0, draggedCategory);

    setCategories(newCategories);
    setDraggedCategoryIndex(null);

    try {
      await Promise.all(
        newCategories.map((category, orderIndex) =>
          updateMenuCategory(category.id, { order_index: orderIndex })
        )
      );
      await refreshRestaurants();
    } catch (error) {
      console.error("Error reordering categories:", error);
      await loadMenuData();
    }
  }

  // Drag and drop handlers for dishes
  function handleDishDragStart(categoryId: string, dishIndex: number) {
    setDraggedDishCategoryId(categoryId);
    setDraggedDishIndex(dishIndex);
  }

  function handleDishDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDishDrop(targetCategoryId: string, targetDishIndex: number) {
    if (draggedDishCategoryId === null || draggedDishIndex === null) return;
    if (draggedDishCategoryId !== targetCategoryId) return;
    if (draggedDishIndex === targetDishIndex) return;
    
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== targetCategoryId) return cat;
        
        const newItems = [...cat.items];
        const [draggedDish] = newItems.splice(draggedDishIndex, 1);
        newItems.splice(targetDishIndex, 0, draggedDish);
        
        return { ...cat, items: newItems };
      })
    );
    
    setDraggedDishCategoryId(null);
    setDraggedDishIndex(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your restaurant menu categories and dishes</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddCategory(!showAddCategory)}
          className="gap-2 w-fit"
        >
          <FolderPlus className="h-4 w-4" />
          Add Category
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTagManager(true)}
          className="gap-2 w-fit"
        >
          <Edit className="h-4 w-4" />
          Manage Global Tags
        </Button>
      </div>

      {categorySaveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {categorySaveError}
        </div>
      )}

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
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Layout
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewCategoryLayoutType('stacked')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  newCategoryLayoutType === 'stacked'
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Stacked List
              </button>
              <button
                type="button"
                onClick={() => setNewCategoryLayoutType('carousel')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  newCategoryLayoutType === 'carousel'
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Infinite Carousel
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
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
          {categories.map((category, catIndex) => (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              draggable
              onDragStart={() => handleCategoryDragStart(catIndex)}
              onDragOver={handleCategoryDragOver}
              onDrop={() => handleCategoryDrop(catIndex)}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                  <span className="text-sm text-gray-500">({category.items.length} dishes)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 mr-2">
                    <button
                      type="button"
                      onClick={() => handleCategoryLayoutTypeChange(category.id, 'stacked')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        category.layout_type === 'stacked'
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Stacked
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategoryLayoutTypeChange(category.id, 'carousel')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        category.layout_type === 'carousel'
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Carousel
                    </button>
                  </div>
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
                    {category.items.map((item, dishIndex) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        draggable
                        onDragStart={() => handleDishDragStart(category.id, dishIndex)}
                        onDragOver={handleDishDragOver}
                        onDrop={() => handleDishDrop(category.id, dishIndex)}
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
                      disabled={uploadingImage}
                      className="gap-2 w-full"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Image from Files or Photo Library
                        </>
                      )}
                    </Button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
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

              {/* Dietary Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {["Vegan", "Vegetarian", "Gluten-Free", "Spicy", "Contains Nuts", ...customTags].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        dishForm.tags.includes(tag)
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Custom tag (e.g., Keto, Dairy-Free)"
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

      {/* Global Tag Manager Modal */}
      {showTagManager && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-[calc(100%-2rem)] max-w-md mx-auto max-h-[85vh] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col">
            {/* Fixed Header */}
            <div className="p-5 border-b border-gray-50 bg-white rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Manage Global Tags</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTagManager(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                These custom tags are available for all dishes in your menu. Deleting a tag will remove it from all dishes.
              </p>
              
              {/* Add New Global Tag */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Create New Global Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Keto, Dairy-Free"
                    value={newGlobalTag}
                    onChange={(e) => setNewGlobalTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addGlobalTag()}
                    className="flex-1 h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Button size="sm" onClick={addGlobalTag} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Tag
                  </Button>
                </div>
              </div>
              
              {customTags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No custom tags created yet
                </div>
              ) : (
                <div className="space-y-2">
                  {customTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-900">{tag}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCustomTag(tag)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end">
              <Button onClick={() => setShowTagManager(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
