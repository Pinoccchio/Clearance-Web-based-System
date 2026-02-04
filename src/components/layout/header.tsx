"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification } from "@/lib/types";

interface HeaderProps {
  title: string;
  subtitle?: string;
  notifications?: Notification[];
}

export default function Header({ title, subtitle, notifications = [] }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div>
            <h1 className="text-xl font-semibold text-cjc-navy">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-40 placeholder:text-gray-400"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-slide-in">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-cjc-navy">
                        Notifications
                      </h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            href={notification.link || "#"}
                            className={cn(
                              "flex gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0",
                              !notification.isRead && "bg-blue-50/50"
                            )}
                            onClick={() => setShowNotifications(false)}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm",
                                  !notification.isRead
                                    ? "font-medium text-cjc-navy"
                                    : "text-gray-600"
                                )}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                            )}
                          </Link>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No notifications yet
                          </p>
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-100">
                        <Link
                          href="#"
                          className="block text-center text-sm text-cjc-blue hover:underline font-medium"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
