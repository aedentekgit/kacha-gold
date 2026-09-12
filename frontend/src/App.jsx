import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Coins,
  LayoutGrid,
  Table2,
  LineChart as LineChartIcon,
  Target,
  Settings as SettingsIcon,
  Lock,
  MoreHorizontal,
  X
} from "lucide-react";

import {
  RATES_KEY,
  PURCHASES_KEY,
  TARGET_KEY,
  todayStr,
  nowTime,
  inr,
  fmtCompactINR,
  uid,
  fetchGoodReturns22KRate,
  compareEntriesDesc,
  compareEntriesAsc
} from "./utils/goldHelpers";

import ConfirmModal from "./components/ConfirmModal";
import EditPurchaseModal from "./components/EditPurchaseModal";
import KachaHistoryModal from "./components/KachaHistoryModal";
import FilterToolbar from "./components/FilterToolbar";
import PinLockScreen from "./components/PinLockScreen";

import DashboardPage from "./pages/DashboardPage";
import SellSignalsPage from "./pages/SellSignalsPage";
import AddGoldPage from "./pages/AddGoldPage";
import PurchasesPage from "./pages/PurchasesPage";
import PriceGraphPage from "./pages/PriceGraphPage";
import SettingsPage from "./pages/SettingsPage";
import apiService from "./api/apiService";

const INITIAL_RATES = [];
const INITIAL_PURCHASES = [];


const STYLES = `
  /* Keyframe Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUpFade {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .gl-spin { animation: spin 1s linear infinite; }

  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    background-color: #F8FAFC;
  }
  .gl-root { 
    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; 
    color: #0F172A; 
    background: #F8FAFC; 
    height: 100vh; 
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
    font-weight: 500;
  }
  .gl-root * { box-sizing: border-box; }
  .gl-serif { font-family: 'Manrope', monospace, sans-serif; font-weight: 800; letter-spacing: -0.3px; }
  .gl-display { font-family: 'Manrope', sans-serif; font-weight: 800; }

  /* App Container */
  .gl-container {
    max-width: 1320px;
    width: 100%;
    margin: 0 auto;
    padding-left: 18px;
    padding-right: 18px;
    box-sizing: border-box;
  }

  /* Scrollable Body Container */
  .gl-body-scroll-wrap {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 24px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .gl-body-scroll-wrap::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }

  /* Desktop vs Mobile Utilities */
  .gl-desktop-table-wrap { display: block; }
  .gl-mobile-cards-list { display: none; }

  /* Header & Navigation Bar */
  .gl-header-wrap {
    position: sticky;
    top: 0;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #E2E8F0;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    padding: calc(16px + env(safe-area-inset-top, 0px)) 0 0;
    z-index: 100;
  }
  .gl-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    padding-bottom: 14px;
  }
  .gl-header-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex-shrink: 0;
  }
  .gl-brand-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #FFFDF9 0%, #FAF3E8 100%);
    border: 1px solid #E5C378;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(184, 134, 11, 0.12);
  }
  .gl-brand-title {
    font-family: 'Manrope', sans-serif;
    font-size: 19px;
    font-weight: 700;
    margin: 0;
    color: #0F172A;
    letter-spacing: -0.3px;
    white-space: nowrap;
  }
  .gl-brand-sub {
    font-size: 11px;
    color: #059669;
    margin: 1px 0 0;
    font-weight: 500;
    white-space: nowrap;
    letter-spacing: 0.2px;
  }

  .gl-quick-stat-strip {
    display: flex;
    gap: 14px;
    align-items: center;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 6px 14px;
    color: #0F172A;
    white-space: nowrap;
    flex-shrink: 0;
    font-family: 'Manrope', sans-serif;
    font-weight: 700;
  }

  /* Tabs Bar */
  .gl-tabs-wrapper {
    border-top: 1px solid #F1F5F9;
    background: #FFFFFF;
  }
  .gl-tabs {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 8px 0;
  }
  .gl-tabs::-webkit-scrollbar { display: none; }
  .gl-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    color: #64748B;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;
    font-family: 'Manrope', sans-serif;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }
  .gl-tab:hover { color: #0F172A; background: #F1F5F9; }
  .gl-tab.active {
    color: #059669;
    background: #ECFDF5;
    border-color: #A7F3D0;
    font-weight: 700;
  }

  /* Filter Toolbar */
  .gl-filter-bar {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 10px 16px;
    margin: 12px 0 16px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  .gl-filter-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 800;
    color: #059669;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .gl-filter-options {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .gl-filter-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    flex-shrink: 0;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    color: #475569;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    min-height: 32px;
    transition: all 0.15s ease;
  }
  .gl-filter-btn:hover { color: #059669; border-color: #A7F3D0; background: #ECFDF5; }
  .gl-filter-btn.active {
    background: #059669;
    color: #FFFFFF;
    border-color: #047857;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(5, 150, 105, 0.2);
  }
  .gl-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-color: #FFFFFF;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%64748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding: 6px 30px 6px 12px;
    border: 1px solid #E2E8F0;
    color: #0F172A;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    outline: none;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
  }
  .gl-select:hover {
    border-color: #A7F3D0;
    background-color: #F8FAFC;
  }
  .gl-select:focus {
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
  }

  @keyframes glDropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Content Wrapper */
  .gl-body {
    padding-top: 12px;
    padding-bottom: 24px;
  }

  /* Modern Elevated Cards */
  .gl-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
  }
  .gl-card:hover {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
    border-color: #CBD5E1;
  }
  .gl-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .gl-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

  /* Text & Labels */
  .gl-label { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; font-family: 'Manrope', sans-serif; letter-spacing: 0.5px; }
  .gl-value { font-size: 14px; font-weight: 700; color: #0F172A; font-family: 'Manrope', sans-serif; }
  .gl-value-lg { font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 800; color: #059669; }
  .gl-section-title {
    font-family: 'Manrope', sans-serif;
    font-size: 16px;
    color: #0F172A;
    margin: 0 0 12px;
    letter-spacing: -0.2px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Form Inputs */
  .gl-input {
    width: 100%;
    background: #F8FAFC;
    border: 1.5px solid #E2E8F0;
    color: #0F172A;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    transition: all 0.2s ease;
  }
  .gl-input:focus { outline: none; border-color: #059669; background: #FFFFFF; box-shadow: 0 0 0 3.5px rgba(5, 150, 105, 0.14); }
  .gl-input-label { font-size: 11.5px; color: #475569; display: block; margin-bottom: 6px; font-weight: 700; }

  /* Modern Action Buttons */
  .gl-btn {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: #FFFFFF;
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
    transition: all 0.2s ease;
  }
  .gl-btn:hover { background: linear-gradient(135deg, #047857 0%, #065F46 100%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35); }
  .gl-btn:active { transform: translateY(0); }
  .gl-btn:disabled { background: #E2E8F0; color: #94A3B8; box-shadow: none; cursor: not-allowed; transform: none; }

  .gl-btn-ghost {
    background: #F8FAFC;
    color: #059669;
    border: 1px solid #E2E8F0;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    line-height: 1;
    transition: all 0.15s ease;
  }
  .gl-btn-ghost:hover { background: #ECFDF5; border-color: #A7F3D0; color: #047857; }
  .gl-btn-sm {
    padding: 5px 10px;
    font-size: 11.5px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    line-height: 1;
  }

  /* Sleek Badges */
  .gl-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
  }
  @keyframes gl-sell-blink {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.6);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.04);
      box-shadow: 0 0 0 8px rgba(5, 150, 105, 0);
    }
  }

  .gl-badge.profit { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
  .gl-badge.loss { background: #FEF2F2; color: #B91C1C; border: 1px solid #FCA5A5; }
  .gl-badge.sell-strong {
    background: #059669 !important;
    color: #FFFFFF !important;
    border: 1px solid transparent !important;
  }
  .gl-badge.sell-strong,
  .sell-strong,
  .gl-pulse-sell {
    animation: gl-sell-blink 1.2s infinite ease-in-out !important;
  }
  .gl-badge.sell-hold {
    background: #FFFBEB;
    color: #B45309;
    border: 1px solid #FDE68A;
  }

  /* Signal Hero Box */
  .gl-signal-hero {
    background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
    color: #FFFFFF;
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 16px;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
  }
  .gl-signal-hero-body { display: flex; justify-content: space-between; align-items: center; gap: 16px; }

  /* Active Rate Banner */
  .gl-active-rate-banner {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 12px 18px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .gl-hero-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  @media (max-width: 900px) {
    .gl-hero-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  }

  .gl-hero-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 95px;
  }
  .gl-hero-label {
    font-size: 11px;
    color: #64748B;
    font-weight: 700;
    text-transform: uppercase;
  }
  .gl-hero-val {
    margin: 4px 0;
    font-size: 20px;
    font-weight: 800;
    font-family: 'Manrope', sans-serif;
  }
  .gl-hero-sub {
    font-size: 11px;
    line-height: 1.3;
    font-weight: 500;
    color: #64748B;
  }

  /* Table Grid Styling */
  .gl-table-wrapper { width: 100%; overflow-x: auto; border-radius: 12px; border: 1px solid #E2E8F0; }
  .gl-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13.5px; font-family: 'Manrope', sans-serif; }
  .gl-table th { background: #F8FAFC; color: #475569; padding: 12px 16px; font-weight: 700; text-transform: uppercase; font-size: 11.5px; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0; white-space: nowrap; font-family: 'Manrope', sans-serif; }
  .gl-table td { padding: 12px 16px; border-bottom: 1px solid #F1F5F9; color: #0F172A; vertical-align: middle; font-weight: 600; font-size: 13.5px; font-family: 'Manrope', sans-serif; }
  .gl-table tr:last-child td { border-bottom: none; }
  .gl-table tr:hover td { background: #F8FAFC; }
  .gl-excel-total-row td { background: #ECFDF5 !important; border-top: 2px solid #059669 !important; color: #047857 !important; font-weight: 800 !important; font-size: 14px !important; padding: 14px 16px !important; }

  /* Thumbnails */
  .gl-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid #E2E8F0; }
  .gl-thumb-placeholder { width: 40px; height: 40px; border-radius: 8px; background: #F1F5F9; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; color: #64748B; }
  .gl-upload-box { border: 2px dashed #CBD5E1; background: #F8FAFC; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; color: #475569; font-weight: 700; font-size: 13px; transition: border-color 0.2s ease; }
  .gl-upload-box:hover { border-color: #059669; color: #059669; }

  /* Modern Glassmorphism Mobile Bottom Navigation Bar */
  .gl-mobile-bottom-bar {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: calc(58px + env(safe-area-inset-bottom, 0px));
    min-height: calc(58px + env(safe-area-inset-bottom, 0px));
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid #E2E8F0;
    box-shadow: 0 -3px 16px rgba(15, 23, 42, 0.05);
    z-index: 9999;
    padding: 4px 6px calc(4px + env(safe-area-inset-bottom, 0px)) 6px;
    justify-content: space-around;
    align-items: stretch;
    box-sizing: border-box;
  }
  .gl-mobile-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 3px 2px 2px 2px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    border-radius: 12px;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    min-width: 0;
    height: 100%;
    box-sizing: border-box;
  }
  .gl-mobile-nav-icon-box {
    height: 26px;
    width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    margin-bottom: 2px;
    flex-shrink: 0;
  }
  .gl-mobile-nav-item.active .gl-mobile-nav-icon-box {
    background: #ECFDF5;
  }
  .gl-mobile-nav-label {
    font-size: 10px;
    line-height: 1.15;
    font-weight: 600;
    color: #64748B;
    text-align: center;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    height: 22px;
    width: 100%;
    overflow: hidden;
    letter-spacing: -0.1px;
    transition: color 0.15s ease;
    font-family: 'Manrope', sans-serif;
  }
  .gl-mobile-nav-item.active .gl-mobile-nav-label {
    color: #047857;
    font-weight: 600;
  }

  /* Mobile More Drawer Sheet */
  .gl-mobile-more-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    justify-content: flex-end;
    flex-direction: column;
  }
  .gl-mobile-more-sheet {
    background: #FFFFFF;
    border-radius: 20px 20px 0 0;
    padding: 12px 16px calc(24px + env(safe-area-inset-bottom, 0px));
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
    animation: glSlideUpMobile 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .gl-mobile-more-handle {
    width: 36px;
    height: 4px;
    background: #CBD5E1;
    border-radius: 2px;
    margin: 0 auto 12px;
  }
  .gl-mobile-more-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #F1F5F9;
  }
  .gl-mobile-more-header h4 {
    margin: 0;
    font-family: 'Manrope', sans-serif !important;
    font-size: 15px;
    font-weight: 700;
    color: #0F172A;
  }
  .gl-mobile-more-close {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #64748B;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 6px;
  }
  .gl-mobile-more-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .gl-mobile-more-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid #E2E8F0;
    background: #F8FAFC;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: all 0.15s ease;
  }
  .gl-mobile-more-item:active {
    transform: scale(0.98);
    background: #F1F5F9;
  }
  .gl-mobile-more-item.active {
    background: #ECFDF5;
    border-color: #A7F3D0;
  }
  .gl-more-icon-wrap {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #475569;
    background: transparent;
  }
  .gl-mobile-more-item.active .gl-more-icon-wrap {
    color: #059669;
  }
  .gl-more-item-text {
    flex: 1;
    min-width: 0;
  }
  .gl-more-item-title {
    font-size: 14.5px;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 2px;
  }
  .gl-more-item-sub {
    font-size: 12px;
    color: #64748B;
  }

  /* Mobile Cards for Lot & Purchase Lists */
  .gl-mobile-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  .gl-mobile-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #F1F5F9;
  }
  .gl-mobile-card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5px;
    margin-bottom: 6px;
  }
  .gl-chart-box {
    width: 100%;
    height: 380px;
  }

  @media (max-width: 900px) {
    .gl-hero-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .gl-grid2, .gl-grid3 { grid-template-columns: 1fr !important; gap: 14px; }
    .gl-quick-stat-strip { gap: 10px; padding: 4px 10px; }
  }

  @media (max-width: 768px) {
    .gl-quick-stat-strip { display: none !important; }
    .gl-brand-sub { display: none !important; }
    .gl-brand-title { font-size: 16px; }
  }

  @media (max-width: 640px) {
    .gl-root { padding-bottom: 0; }
    .gl-body-scroll-wrap {
      padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px));
      padding-top: 6px;
    }
    .gl-container {
      padding-left: calc(16px + env(safe-area-inset-left, 0px)) !important;
      padding-right: calc(16px + env(safe-area-inset-right, 0px)) !important;
      box-sizing: border-box;
    }
    .gl-body {
      padding-top: 8px;
      padding-bottom: 20px;
    }

    .gl-header-wrap { padding: calc(10px + env(safe-area-inset-top, 0px)) 0 0; }
    .gl-header { flex-direction: row; justify-content: space-between; align-items: center; gap: 8px; padding-bottom: 10px; }
    .gl-card { padding: 14px 14px; margin-bottom: 12px; border-radius: 16px; }

    .gl-mobile-bottom-bar { display: flex; }
    .gl-tabs-wrapper { display: none; }

    .gl-signal-hero-body { flex-direction: column; align-items: flex-start; gap: 10px; }

    .gl-desktop-table-wrap { display: none; }
    .gl-mobile-cards-list { display: flex; flex-direction: column; gap: 10px; }
    .gl-chart-box { height: 260px; }
    .gl-grid2, .gl-grid3 { grid-template-columns: 1fr !important; gap: 12px; }
    .gl-input { font-size: 15px; padding: 10px 12px; }
  }

  .gl-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%; height: 100%; height: 100dvh;
    background-color: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    overscroll-behavior: contain;
    box-sizing: border-box;
    animation: glOverlayFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .gl-modal-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
    width: 100%;
    max-height: 85dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overscroll-behavior: contain;
    box-sizing: border-box;
    animation: glModalPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: transform, opacity;
  }
  .gl-modal-handle { display: none; }

  @media (max-width: 640px) {
    .gl-modal-overlay {
      align-items: flex-end;
      padding: 0;
    }
    .gl-modal-card {
      max-width: 100%;
      border-radius: 20px 20px 0 0;
      border-bottom: none;
      max-height: 85dvh;
      padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px)) 16px;
      animation: glSlideUpMobile 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .gl-modal-handle {
      display: block;
      width: 40px;
      height: 4px;
      background: #E2E8F0;
      border-radius: 4px;
      margin: 0 auto 12px auto;
      flex-shrink: 0;
    }
  }

  .gl-empty {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 36px 20px;
    text-align: center;
    color: #64748B;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;
    margin: 20px auto;
    max-width: 600px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
`;

const TABS = [
  { id: "signals", path: "/signals", keyTag: "F1", label: "Sell Signals", icon: Target },
  { id: "dashboard", path: "/dashboard", keyTag: "F2", label: "Kacha Update", icon: LayoutGrid },
  { id: "add", path: "/add", keyTag: "F3", label: "Add Gold", icon: Plus },
  { id: "ledger", path: "/purchases", keyTag: "F4", label: "Purchase List", icon: Table2 },
  { id: "trends", path: "/trends", keyTag: "F5", label: "Price Graph", icon: LineChartIcon },
  { id: "settings", path: "/settings", keyTag: "F6", label: "Settings", icon: SettingsIcon },
];

const MOBILE_MAIN_TABS = [
  { id: "signals", path: "/signals", label: "Sell Signals", icon: Target },
  { id: "dashboard", path: "/dashboard", label: "Kacha Update", icon: LayoutGrid },
  { id: "add", path: "/add", label: "Add Gold", icon: Plus },
  { id: "ledger", path: "/purchases", label: "Purchases", icon: Table2 },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rates, setRates] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [targetProfit, setTargetProfit] = useState(250);
  const [targetProfitPct, setTargetProfitPct] = useState(5);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const scrollRef = useRef(null);

  // Security PIN & Authentication State
  const [appPin, setAppPin] = useState(() => {
    const saved = localStorage.getItem("gl_app_pin");
    if (saved && saved.length === 6) return saved;
    return "123456";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("gl_pin_authenticated") === "true";
  });

  const handlePinSuccess = useCallback(() => {
    setIsAuthenticated(true);
    sessionStorage.setItem("gl_pin_authenticated", "true");
  }, []);

  const handleLockApp = useCallback(() => {
    setShowMobileMore(false);
    setConfirmState({
      title: "Lock Application?",
      message: "Are you sure you want to lock the app? You will need your 6-digit PIN to access it again.",
      confirmText: "Lock App",
      confirmVariant: "danger",
      icon: Lock,
      onConfirm: () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem("gl_pin_authenticated");
      }
    });
  }, []);

  const handleUpdatePin = useCallback(async (newPin) => {
    const clean = String(newPin).trim();
    await apiService.updateSettings({ appPin: clean });
    setAppPin(clean);
    localStorage.setItem("gl_app_pin", clean);
  }, []);

  const handleUpdateTargets = useCallback(async (newMargin, newPct) => {
    const validMargin = Math.max(0, parseFloat(newMargin) || 0);
    const validPct = Math.max(0, parseFloat(newPct) || 0);
    setTargetProfit(validMargin);
    setTargetProfitPct(validPct);
    localStorage.setItem("gl_target_profit", validMargin.toString());
    localStorage.setItem("gl_target_profit_pct", validPct.toString());
    await apiService.updateSettings({ targetProfit: validMargin, targetProfitPct: validPct });
  }, []);

  const persistTargetPct = async (newPct) => {
    const validPct = Math.max(0, parseFloat(newPct) || 0);
    setTargetProfitPct(validPct);
    try {
      if (typeof window !== "undefined" && window.storage && window.storage.set) {
        window.storage.set("gl_target_profit_pct", validPct.toString(), false);
      }
      localStorage.setItem("gl_target_profit_pct", validPct.toString());
      await apiService.updateSettings({ targetProfitPct: validPct });
    } catch (e) {
      console.error("Storage save target pct error:", e);
    }
  };

  const isTabActive = useCallback((tabPath) => {
    if (tabPath === "/signals" && (location.pathname === "/signals" || location.pathname === "/")) return true;
    if (tabPath === "/dashboard" && location.pathname === "/dashboard") return true;
    if (tabPath === "/purchases" && (location.pathname === "/purchases" || location.pathname === "/ledger")) return true;
    if (tabPath === "/trends" && (location.pathname === "/trends" || location.pathname === "/price-graph")) return true;
    if (tabPath === "/settings" && location.pathname === "/settings") return true;
    return location.pathname === tabPath;
  }, [location.pathname]);

  const handleSaveEdit = async (updatedItem) => {
    const next = purchases.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    await persistPurchases(next);
    setEditingItem(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Global Time Filters state
  const [filterMode, setFilterMode] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(todayStr().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(todayStr());
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState(todayStr());
  const [sortOrder, setSortOrder] = useState("desc");
  const [showKachaModal, setShowKachaModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleOpenKachaHistory = (item = null) => {
    setSelectedHistoryItem(item);
    setShowKachaModal(true);
  };

  // Load Data from Backend API
  useEffect(() => {
    (async () => {
      try {
        const [fetchedRates, fetchedPurchases, fetchedSettings] = await Promise.all([
          apiService.getRates().catch(() => null),
          apiService.getPurchases().catch(() => null),
          apiService.getSettings().catch(() => null),
        ]);

        let r = Array.isArray(fetchedRates) ? fetchedRates : [];
        let p = Array.isArray(fetchedPurchases) ? fetchedPurchases : [];
        let t = 250;
        let tPct = 5;

        if (fetchedSettings) {
          if (fetchedSettings.targetProfit !== undefined) t = fetchedSettings.targetProfit;
          if (fetchedSettings.targetProfitPct !== undefined) tPct = fetchedSettings.targetProfitPct;
          if (fetchedSettings.appPin || fetchedSettings.pin) {
            const fetchedPin = String(fetchedSettings.appPin || fetchedSettings.pin).trim();
            setAppPin(fetchedPin);
            localStorage.setItem("gl_app_pin", fetchedPin);
          }
        }

        // Clean up any auto-synced entries so only user-explicitly saved rates exist
        let cleanedRates = [];
        for (const entry of r) {
          if (entry.autoSynced) {
            try {
              await apiService.deleteRate(entry.id);
            } catch (err) { }
          } else {
            cleanedRates.push(entry);
          }
        }

        setRates(cleanedRates);
        setPurchases(p);
        setTargetProfit(t);
        setTargetProfitPct(tPct);
        setReady(true);
      } catch (e) {
        console.error("Storage load error:", e);
        setRates([]);
        setPurchases([]);
        setReady(true);
      }

    })();
  }, []);

  const persistRates = useCallback(async (next) => {
    setRates(next);
    // Find additions, deletions, or updates
    try {
      if (next.length === 0) {
        // Clear all
        for (const r of rates) {
          await apiService.deleteRate(r.id).catch(() => { });
        }
      } else {
        // Sync diffs
        const existingIds = new Set(rates.map(r => r.id));
        const nextIds = new Set(next.map(r => r.id));

        for (const item of next) {
          if (!existingIds.has(item.id)) {
            await apiService.addRate(item).catch(() => { });
          } else {
            await apiService.updateRate(item.id, item).catch(() => { });
          }
        }

        for (const item of rates) {
          if (!nextIds.has(item.id)) {
            await apiService.deleteRate(item.id).catch(() => { });
          }
        }
      }
    } catch (err) {
      console.error("Persist rates error:", err);
    }
  }, [rates]);

  const persistPurchases = useCallback(async (next) => {
    setPurchases(next);
    try {
      if (next.length === 0) {
        for (const p of purchases) {
          await apiService.deletePurchase(p.id).catch(() => { });
        }
      } else {
        const existingIds = new Set(purchases.map(p => p.id));
        const nextIds = new Set(next.map(p => p.id));

        for (const item of next) {
          if (!existingIds.has(item.id)) {
            await apiService.addPurchase(item).catch(() => { });
          } else {
            await apiService.updatePurchase(item.id, item).catch(() => { });
          }
        }

        for (const item of purchases) {
          if (!nextIds.has(item.id)) {
            await apiService.deletePurchase(item.id).catch(() => { });
          }
        }
      }
    } catch (err) {
      console.error("Persist purchases error:", err);
    }
  }, [purchases]);

  const persistTarget = useCallback(async (val) => {
    setTargetProfit(val);
    try {
      await apiService.updateSettings({ targetProfit: val });
    } catch (err) {
      console.error("Persist target error:", err);
    }
  }, []);

  const filterByDate = useCallback((list) => {
    if (filterMode === "all") return list;
    return list.filter((item) => {
      const itemDate = item.date;
      if (!itemDate) return false;
      if (filterMode === "year") {
        return itemDate.startsWith(selectedYear);
      }
      if (filterMode === "month") {
        return selectedMonth ? itemDate.startsWith(selectedMonth) : true;
      }
      if (filterMode === "day") {
        return selectedDay ? itemDate === selectedDay : true;
      }
      if (filterMode === "custom") {
        if (customStart && itemDate < customStart) return false;
        if (customEnd && itemDate > customEnd) return false;
        return true;
      }
      return true;
    });
  }, [filterMode, selectedYear, selectedMonth, selectedDay, customStart, customEnd]);

  // Datasets
  const sortedRates = useMemo(() => [...rates].sort(compareEntriesAsc), [rates]);

  const latestRate = useMemo(() => {
    if (!sortedRates || !sortedRates.length) return null;
    return sortedRates[sortedRates.length - 1];
  }, [sortedRates]);

  const kachaPerGram = useMemo(() => {
    if (sortedRates && sortedRates.length) {
      const lastWithKacha = [...sortedRates].reverse().find(e => e.kacha !== undefined && e.kacha !== null);
      if (lastWithKacha) return lastWithKacha.kacha;
    }
    if (purchases && purchases.length) {
      const lastPurchase = [...purchases].reverse().find(p => p.kachaRate);
      if (lastPurchase) return lastPurchase.kachaRate;
    }
    return null;
  }, [sortedRates, purchases]);

  const previousKachaRate = useMemo(() => {
    if (!sortedRates || !sortedRates.length) return null;
    const validRates = sortedRates.filter(e => e.kacha !== undefined && e.kacha !== null);
    if (validRates.length >= 2) {
      return validRates[validRates.length - 2].kacha;
    }
    return validRates.length ? validRates[0].kacha : null;
  }, [sortedRates]);

  const highMetrics = useMemo(() => {
    if (!sortedRates.length) return { high7Day: null, highMonthly: null, high52Week: null };

    const now = new Date();
    const nowTs = now.getTime();
    const sevenDaysAgo = nowTs - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = nowTs - 30 * 24 * 60 * 60 * 1000;

    let high7Day = null;
    let highMonthly = null;
    let high52Week = null;

    sortedRates.forEach((r) => {
      if (!r.kacha) return;
      const k = r.kacha;
      const entryTs = r.createdAt || (r.date ? new Date(r.date).getTime() : 0);

      if (high52Week === null || k > high52Week) {
        high52Week = k;
      }
      if (entryTs >= thirtyDaysAgo || (r.date && r.date >= todayStr().slice(0, 7))) {
        if (highMonthly === null || k > highMonthly) {
          highMonthly = k;
        }
      }
      if (entryTs >= sevenDaysAgo) {
        if (high7Day === null || k > high7Day) {
          high7Day = k;
        }
      }
    });

    return {
      high7Day: high7Day || (highMonthly || high52Week),
      highMonthly: highMonthly || high52Week,
      high52Week: high52Week
    };
  }, [sortedRates]);

  const filteredRates = useMemo(() => filterByDate(sortedRates), [sortedRates, filterByDate]);
  const sortedPurchases = useMemo(() => [...purchases].sort(compareEntriesDesc), [purchases]);
  const filteredPurchases = useMemo(() => filterByDate(sortedPurchases), [sortedPurchases, filterByDate]);

  const availableYears = useMemo(() => {
    const years = new Set();
    years.add(new Date().getFullYear().toString());
    rates.forEach(r => r.date && years.add(r.date.slice(0, 4)));
    purchases.forEach(p => p.date && years.add(p.date.slice(0, 4)));
    return Array.from(years).sort().reverse();
  }, [rates, purchases]);

  const rateForDate = useCallback((dateStr) => {
    const applicable = sortedRates.filter((r) => r.date <= dateStr);
    return applicable.length ? applicable[applicable.length - 1] : (sortedRates.length ? sortedRates[0] : null);
  }, [sortedRates]);

  const previousRateForDate = useCallback((dateStr) => {
    if (dateStr) {
      const prior = sortedRates.filter((r) => r.date < dateStr);
      if (prior.length) return prior[prior.length - 1];
    }
    if (previousKachaRate !== null) {
      return { kacha: previousKachaRate };
    }
    return sortedRates.length >= 2 ? sortedRates[sortedRates.length - 2] : null;
  }, [sortedRates, previousKachaRate]);

  const toggleSoldPurchase = useCallback((id) => {
    const target = purchases.find((p) => p.id === id);
    if (!target) return;

    const willBeSold = !target.isSold;
    const lotDesc = target.grams ? `${target.grams.toFixed(2)}g` : "this lot";

    setConfirmState({
      title: willBeSold ? "Mark Lot as Sold?" : "Restore Lot to Active?",
      message: willBeSold
        ? `Are you sure you want to mark this purchase (${lotDesc}) as Sold? It will be archived and removed from active Sell Signals.`
        : `Are you sure you want to restore this purchase (${lotDesc}) back to Active? It will be included in your active gold portfolio and Sell Signals.`,
      confirmText: willBeSold ? "Mark as Sold" : "Restore to Active",
      confirmVariant: willBeSold ? "danger" : "primary",
      onConfirm: async () => {
        const next = purchases.map((p) => (p.id === id ? { ...p, isSold: willBeSold } : p));
        await persistPurchases(next);
      }
    });
  }, [purchases, persistPurchases]);

  const totals = useMemo(() => {
    const activeList = filteredPurchases.filter((p) => !p.isSold);
    const totalGrams = activeList.reduce((s, p) => s + (p.grams || 0), 0);
    const totalInvested = activeList.reduce((s, p) => s + (p.overallPrice || ((p.grams || 0) * (p.ratePaid || 0))), 0);
    const avgRate = totalGrams ? totalInvested / totalGrams : null;

    let unrealized = 0;
    let hasVal = false;

    activeList.forEach((p) => {
      const rateObj = rateForDate(p.date);
      const purchaseKacha = (p.purchaseKacha !== undefined && p.purchaseKacha !== null)
        ? p.purchaseKacha
        : ((p.kachaAtPurchase !== undefined && p.kachaAtPurchase !== null)
          ? p.kachaAtPurchase
          : (p.ratePaid || (rateObj ? rateObj.kacha : kachaPerGram)));
      const activeKacha = kachaPerGram !== null ? kachaPerGram : purchaseKacha;

      if (activeKacha !== null && purchaseKacha !== null) {
        unrealized += (activeKacha - purchaseKacha) * (p.grams || 1);
        hasVal = true;
      }
    });

    const finalUnrealized = hasVal ? unrealized : null;
    const profitPercent = totalInvested && finalUnrealized !== null ? (finalUnrealized / totalInvested) * 100 : 0;
    return { totalGrams, totalInvested, avgRate, currentValue: null, unrealized: finalUnrealized, profitPercent, count: activeList.length };
  }, [filteredPurchases, kachaPerGram, rateForDate]);

  const sellAnalysis = useMemo(() => {
    const activePurchases = (filteredPurchases || purchases).filter((p) => !p.isSold);
    if (!kachaPerGram || !activePurchases.length) return null;

    let strongSellGrams = 0;
    let strongSellProfit = 0;
    let strongSellCount = 0;
    let totalSellableValue = 0;

    const items = activePurchases.map((p) => {
      const rateObj = rateForDate(p.date);
      const purchaseKacha = (p.purchaseKacha !== undefined && p.purchaseKacha !== null)
        ? p.purchaseKacha
        : ((p.kachaAtPurchase !== undefined && p.kachaAtPurchase !== null)
          ? p.kachaAtPurchase
          : (p.ratePaid || (rateObj ? rateObj.kacha : kachaPerGram)));
      const activeKacha = kachaPerGram;

      const margin = (activeKacha !== null && purchaseKacha !== null) ? activeKacha - purchaseKacha : 0;
      const itemProfit = margin * (p.grams || 1);
      const marginPct = purchaseKacha > 0 ? (margin / purchaseKacha) * 100 : 0;

      let status = "HOLD";
      if (marginPct >= targetProfitPct) {
        status = "STRONG_SELL";
        strongSellGrams += (p.grams || 1);
        strongSellProfit += itemProfit;
        strongSellCount += 1;
      } else if (marginPct > 0) {
        status = "MODERATE_SELL";
      }

      totalSellableValue += (p.grams || 1) * kachaPerGram;

      return { ...p, margin, itemProfit, marginPct, status, purchaseKacha, activeKacha };
    });

    return {
      items,
      strongSellGrams,
      strongSellProfit,
      strongSellCount,
      totalSellableValue,
      count: activePurchases.length,
      kachaPerGram,
      targetProfitPct
    };
  }, [filteredPurchases, purchases, kachaPerGram, rateForDate, targetProfitPct]);

  const requestConfirm = (config) => setConfirmState(config);

  if (!isAuthenticated) {
    return <PinLockScreen expectedPin={appPin} onSuccess={handlePinSuccess} />;
  }

  return (
    <div className="gl-root">
      <style>{STYLES}</style>

      {/* Fixed Native Top App Bar Header */}
      <header className="gl-header-wrap">
        <div className="gl-container gl-header">
          <div className="gl-header-brand">
            <div className="gl-brand-icon">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="VMoney Gold Logo"
                style={{
                  width: isMobile ? 28 : 34,
                  height: isMobile ? 28 : 34,
                  objectFit: "contain"
                }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 className="gl-brand-title" style={{ fontSize: isMobile ? 15.5 : 19 }}>VMG Kacha Gold</h1>
              {!isMobile && (
                <p className="gl-brand-sub">Live Rate Tracking, Price Graphs & Intelligent Sell Advice</p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10 }}>
            {isMobile ? (
              /* Sleek Mobile Live Rate Ticker Pill */
              <div
                onClick={() => handleOpenKachaHistory(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  borderRadius: 9999,
                  padding: "4px 9px",
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#047857",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(5, 150, 105, 0.08)"
                }}
              >
                <span style={{ fontSize: 9.5, color: "#065F46", textTransform: "uppercase", fontWeight: 700 }}>Kacha</span>
                <span>{kachaPerGram ? inr(kachaPerGram) : "—"}</span>
              </div>
            ) : (
              <div className="gl-quick-stat-strip">
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Board (22K)</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#0F172A" }}>{latestRate ? inr(latestRate.board) : "—"}</div>
                </div>
                <div style={{ width: 1, height: 22, background: "#CBD5E1" }} />
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Kacha</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#B45309" }}>{kachaPerGram ? inr(kachaPerGram) : "—"}</div>
                </div>
                <div style={{ width: 1, height: 22, background: "#CBD5E1" }} />
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Portfolio P/L</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: totals.unrealized >= 0 ? "#15803D" : "#DC2626" }}>
                    {totals.unrealized !== null ? ((totals.unrealized >= 0 ? "+" : "") + inr(totals.unrealized)) : "—"}
                  </div>
                </div>
              </div>
            )}

            {/* Lock Button */}
            <button
              type="button"
              onClick={handleLockApp}
              title="Lock Application"
              className="gl-header-lock-btn"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? 32 : 36,
                height: isMobile ? 32 : 36,
                borderRadius: 10,
                color: "#475569",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                transition: "all 0.15s ease",
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#DC2626";
                e.currentTarget.style.borderColor = "#FECACA";
                e.currentTarget.style.backgroundColor = "#FEF2F2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#475569";
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
            >
              <Lock size={isMobile ? 14 : 16} />
            </button>
          </div>
        </div>

        {/* Header Tabs (Desktop Only) */}
        <div className="gl-tabs-wrapper">
          <div className="gl-container">
            <div className="gl-tabs">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = isTabActive(t.path);
                return (
                  <button key={t.id} className={`gl-tab ${active ? "active" : ""}`} onClick={() => navigate(t.path)}>
                    <Icon size={15} />
                    <span>{t.label}</span>
                    {t.id === "signals" && sellAnalysis && sellAnalysis.strongSellCount > 0 && (
                      <span className="gl-pulse-sell" style={{ background: "#059669", color: "#FFFFFF", borderRadius: 10, padding: "2px 7px", fontSize: 10, fontWeight: 900, marginLeft: 2 }}>
                        {sellAnalysis.strongSellCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Isolated Content Scroll Area */}
      <div className="gl-body-scroll-wrap" ref={scrollRef}>

        <main className="gl-container gl-body">
          {/* Time Filters Toolbar (Only on Signals, Purchases & Trends) */}
          {(location.pathname === "/" || location.pathname === "/signals" || location.pathname === "/purchases" || location.pathname === "/trends") && (
            <FilterToolbar
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              availableYears={availableYears}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
            />
          )}

          {!ready ? (
            <div className="gl-empty">Loading your gold ledger…</div>
          ) : (
            <div key={location.pathname} className="gl-page-transition">
              <Routes>
                <Route path="/" element={<Navigate to="/signals" replace />} />
                <Route
                  path="/signals"
                  element={
                    <SellSignalsPage
                      sellAnalysis={sellAnalysis}
                      targetProfit={targetProfit}
                      targetProfitPct={targetProfitPct}
                      setTargetProfitPct={persistTargetPct}
                      persistTarget={persistTarget}
                      kachaPerGram={kachaPerGram}
                      highMetrics={highMetrics}
                      purchases={filteredPurchases.filter((p) => !p.isSold)}
                      rateForDate={rateForDate}
                      totals={totals}
                      sortedRates={filteredRates}
                      onOpenKachaHistory={handleOpenKachaHistory}
                      sortOrder={sortOrder}
                      onToggleSold={toggleSoldPurchase}
                    />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <DashboardPage
                      latestRate={latestRate}
                      kachaPerGram={kachaPerGram}
                      highMetrics={highMetrics}
                      sortedRates={sortedRates}
                      rates={rates}
                      persistRates={persistRates}
                      totals={totals}
                      purchaseCount={purchases.length}
                      sellAnalysis={sellAnalysis}
                      goToSignals={() => navigate("/signals")}
                      goToAdd={() => navigate("/add")}
                      onOpenKachaHistory={handleOpenKachaHistory}
                    />
                  }
                />
                <Route
                  path="/add"
                  element={
                    <AddGoldPage
                      kachaPerGram={kachaPerGram}
                      latestRate={latestRate}
                      purchases={purchases}
                      persistPurchases={persistPurchases}
                      rateForDate={rateForDate}
                      saving={saving}
                      setSaving={setSaving}
                      goToLedger={() => navigate("/purchases")}
                    />
                  }
                />
                <Route
                  path="/purchases"
                  element={
                    <PurchasesPage
                      purchases={filteredPurchases}
                      rateForDate={rateForDate}
                      kachaPerGram={kachaPerGram}
                      persistPurchases={persistPurchases}
                      allPurchases={purchases}
                      requestConfirm={requestConfirm}
                      onEdit={(item) => setEditingItem(item)}
                      onOpenKachaHistory={handleOpenKachaHistory}
                      sortOrder={sortOrder}
                      onToggleSold={toggleSoldPurchase}
                    />
                  }
                />
                <Route path="/ledger" element={<Navigate to="/purchases" replace />} />
                <Route
                  path="/trends"
                  element={
                    <PriceGraphPage
                      sortedRates={filteredRates}
                      purchases={filteredPurchases}
                      totals={totals}
                      targetProfit={targetProfit}
                      kachaPerGram={kachaPerGram}
                      sortOrder={sortOrder}
                      filterMode={filterMode}
                    />
                  }
                />
                <Route path="/price-graph" element={<Navigate to="/trends" replace />} />
                <Route
                  path="/settings"
                  element={
                    <SettingsPage
                      currentPin={appPin}
                      onUpdatePin={handleUpdatePin}
                      onLockApp={handleLockApp}
                      targetProfit={targetProfit}
                      targetProfitPct={targetProfitPct}
                      onUpdateTargets={handleUpdateTargets}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/signals" replace />} />
              </Routes>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sticky Navigation (5 Items) */}
      <nav className="gl-mobile-bottom-bar">
        {MOBILE_MAIN_TABS.map((t) => {
          const Icon = t.icon;
          const active = isTabActive(t.path);
          return (
            <button
              key={t.id}
              className={`gl-mobile-nav-item ${active ? "active" : ""}`}
              onClick={() => {
                setShowMobileMore(false);
                navigate(t.path);
              }}
            >
              <div className="gl-mobile-nav-icon-box">
                <Icon size={19} color={active ? "#047857" : "#64748B"} />
              </div>
              <span className="gl-mobile-nav-label">{t.label}</span>
            </button>
          );
        })}

        {/* 5th Menu: More Options */}
        {(() => {
          const isMoreActive = isTabActive("/trends") || isTabActive("/settings");
          return (
            <button
              key="more"
              className={`gl-mobile-nav-item ${isMoreActive ? "active" : ""}`}
              onClick={() => setShowMobileMore((prev) => !prev)}
            >
              <div className="gl-mobile-nav-icon-box">
                <MoreHorizontal size={20} color={isMoreActive ? "#047857" : "#64748B"} />
              </div>
              <span className="gl-mobile-nav-label">More</span>
            </button>
          );
        })()}
      </nav>

      {/* Mobile More Bottom Sheet */}
      {showMobileMore && (
        <div
          className="gl-mobile-more-backdrop"
          onClick={() => setShowMobileMore(false)}
        >
          <div
            className="gl-mobile-more-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gl-mobile-more-handle" />
            <div className="gl-mobile-more-header">
              <h4>More Options</h4>
              <button
                type="button"
                className="gl-mobile-more-close"
                onClick={() => setShowMobileMore(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="gl-mobile-more-list">
              <button
                type="button"
                className={`gl-mobile-more-item ${isTabActive("/trends") ? "active" : ""}`}
                onClick={() => {
                  setShowMobileMore(false);
                  navigate("/trends");
                }}
              >
                <div className="gl-more-icon-wrap">
                  <LineChartIcon size={20} color={isTabActive("/trends") ? "#059669" : "#475569"} />
                </div>
                <div className="gl-more-item-text">
                  <div className="gl-more-item-title">Price Graph</div>
                  <div className="gl-more-item-sub">Trends, price movement & historical rates</div>
                </div>
              </button>

              <button
                type="button"
                className={`gl-mobile-more-item ${isTabActive("/settings") ? "active" : ""}`}
                onClick={() => {
                  setShowMobileMore(false);
                  navigate("/settings");
                }}
              >
                <div className="gl-more-icon-wrap">
                  <SettingsIcon size={20} color={isTabActive("/settings") ? "#059669" : "#475569"} />
                </div>
                <div className="gl-more-item-text">
                  <div className="gl-more-item-title">Settings & PIN</div>
                  <div className="gl-more-item-sub">Change 6-digit PIN, targets & DB sync</div>
                </div>
              </button>

              <button
                type="button"
                className="gl-mobile-more-item"
                onClick={() => {
                  setShowMobileMore(false);
                  handleLockApp();
                }}
              >
                <div className="gl-more-icon-wrap">
                  <Lock size={19} color="#475569" />
                </div>
                <div className="gl-more-item-text">
                  <div className="gl-more-item-title">Lock Application</div>
                  <div className="gl-more-item-sub">Instantly lock and return to PIN screen</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen-Wide Root Modals */}
      <KachaHistoryModal
        isOpen={showKachaModal}
        onClose={() => {
          setShowKachaModal(false);
          setSelectedHistoryItem(null);
        }}
        sortedRates={sortedRates}
        purchases={purchases}
        totals={totals}
        selectedItem={selectedHistoryItem}
      />

      <ConfirmModal
        isOpen={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmText={confirmState?.confirmText}
        confirmVariant={confirmState?.confirmVariant || "danger"}
        icon={confirmState?.icon}
        onConfirm={async () => {
          if (confirmState?.onConfirm) {
            await confirmState.onConfirm();
          }
          setConfirmState(null);
        }}
        onClose={() => setConfirmState(null)}
      />

      <EditPurchaseModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
