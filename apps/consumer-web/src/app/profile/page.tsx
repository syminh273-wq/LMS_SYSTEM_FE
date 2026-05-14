'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { setProfile, clearProfile } from "@/lib/redux/userSlice";
import { RootState } from "@/lib/redux/store";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { ArrowLeft, Loader2, LogOut, Upload, X } from "lucide-react";
import { accountService } from "@/lib/api/account";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { profile, isAuthenticated } = useSelector((state: RootState) => state.user);
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || "");
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const updatedProfile = await accountService.getProfile();
        dispatch(setProfile(updatedProfile));
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (!profile) {
          setError("Không thể tải thông tin hồ sơ.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (mounted && isAuthenticated) {
      fetchProfile();
    }
  }, [mounted, isAuthenticated, dispatch]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('phone', phone);
      
      if (newAvatar) {
        formData.append('avatar', newAvatar);
      }
      
      const response = await accountService.updateProfile(formData);
      dispatch(setProfile(response.data));
      setSuccess("Cập nhật hồ sơ thành công!");
      setNewAvatar(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeNewAvatar = () => {
    setNewAvatar(null);
    setAvatarPreview(null);
  };

  const handleLogout = () => {
    dispatch(clearProfile());
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <nav className="w-full bg-white dark:bg-black border-b border-gray-100 p-4 flex items-center justify-between px-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="mr-4"
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Image src="/logo.jpg" alt="LMS LOGO" width={100} height={35} className="h-8 w-auto object-contain mr-4" />
          <h1 className="text-xl font-bold text-indigo-600">Cập nhật hồ sơ</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={saving}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </nav>

      <main className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Thông tin cá nhân</h2>
            <p className="text-gray-500 dark:text-gray-400">Cập nhật ảnh đại diện, tên hiển thị và số điện thoại của bạn.</p>
          </div>

          <div className="mb-8">
            <Label className="text-base font-medium">Ảnh đại diện</Label>
            <div className="flex items-center space-x-6 mt-3">
              <div className="relative">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Current avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-gray-200 flex items-center justify-center">
                    <Upload size={32} className="text-gray-400" />
                  </div>
                )}
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeNewAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    disabled={saving}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                  disabled={saving}
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={16} className="mr-2" />
                  Chọn ảnh mới
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF tối đa 5MB</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ tên của bạn"
                className="rounded-xl"
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0123456789"
                className="rounded-xl"
                disabled={saving}
              />
            </div>

            <div className="pt-4 flex gap-4">
              <Button 
                type="submit" 
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : "Lưu thay đổi"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={() => router.push('/')}
                disabled={saving}
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
