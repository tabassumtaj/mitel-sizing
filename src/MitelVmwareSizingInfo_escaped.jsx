import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

/**
 * MitelVmwareSizingInfo_notes_from_txt.jsx
 *
 * Reads per-tab notes from plain .txt files (from public/) and displays them under each platform tab.
 * - Expected files (place in public/):
 *   /notes-vmware.txt
 *   /notes-hyperv.txt
 *   /notes-nutanix-ahv.txt
 *   /notes-nutanix-esxi.txt
 *   /notes-aws.txt
 *   /notes-azure.txt
 *   /notes-proxmox.txt
 *
 * Behavior:
 * - On mount, the component fetches each notes file. If a file is missing or fails to load,
 *   it will fall back to the default two-line note.
 * - Notes are read-only in the UI (no edit controls).
 * - Excel loading behavior is preserved from the original component.
 */

export default function MitelVmwareSizingInfo_notes_from_txt() {
  const tabs = ["VMware", "Hyper-V", "Nutanix AHV", "Nutanix ESXi", "AWS", "Azure", "Proxmox"];
  const [activeTab, setActiveTab] = useState("VMware");
  const [filters, setFilters] = useState({
    Product: "",
    Release: "",
    Configuration: "",
  });

  // Excel data states
  const [vmwareData, setVmwareData] = useState([]);
  const [hypervData, setHypervData] = useState([]);
  const [nutanixEsxiData, setNutanixEsxiData] = useState([]);
  const [proxmoxData, setProxomoxData] = useState([]);
  const [AWSData, setAWSData] = useState([]);
  const [AzureData, setAzureData] = useState([]);
  const [nutanixAHVData, SetNutanixAHVData] = useState([]);

  // Default fallback note
  const defaultNoteText = "• Contact TechPubs for any information.\\n• This is a new fresh page, so expect faults.";

  // Notes state: content and status per tab
  const [tabNotes, setTabNotes] = useState({
    VMware: { content: defaultNoteText, status: "idle" },
    "Hyper-V": { content: defaultNoteText, status: "idle" },
    "Nutanix AHV": { content: defaultNoteText, status: "idle" },
    "Nutanix ESXi": { content: defaultNoteText, status: "idle" },
    AWS: { content: defaultNoteText, status: "idle" },
    Azure: { content: defaultNoteText, status: "idle" },
    Proxmox: { content: defaultNoteText, status: "idle" },
  });

  // Helper to map tab to filename
  const filenameForTab = (tab) => {
    const map = {
      VMware: "/notes-vmware.txt",
      "Hyper-V": "/notes-hyperv.txt",
      "Nutanix AHV": "/notes-nutanix-ahv.txt",
      "Nutanix ESXi": "/notes-nutanix-esxi.txt",
      AWS: "/notes-aws.txt",
      Azure: "/notes-azure.txt",
      Proxmox: "/notes-proxmox.txt",
    };
    return map[tab] || null;
  };

  // Load Excel data on mount (keeps original behavior)
  useEffect(() => {
    const loadExcel = async (fileName, setData) => {
      try {
        const response = await fetch(fileName);
        if (!response.ok) {
          console.warn(`Could not fetch ${fileName}: ${response.status}`);
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        setData(jsonData);
      } catch (err) {
        console.error("Error loading excel", fileName, err);
      }
    };

    loadExcel("/Sizing-VMWare.xlsx", setVmwareData);
    loadExcel("/Sizing-hyperv.xlsx", setHypervData);
    loadExcel("/Sizing-Nutanix-ESXi.xlsx", setNutanixEsxiData);
    loadExcel("/Sizing-Proxmox.xlsx", setProxomoxData);
    loadExcel("/Sizing-Azure.xlsx", setAzureData);
    loadExcel("/Sizing-AWS.xlsx", setAWSData);
    loadExcel("/Sizing-Nutanix-AHV.xlsx", SetNutanixAHVData);
  }, []);

  // On mount, fetch all notes files (prefetch)
  useEffect(() => {
    const tabsToFetch = tabs;
    tabsToFetch.forEach(async (tab) => {
      const url = filenameForTab(tab);
      if (!url) return;
      try {
        setTabNotes((prev) => ({ ...prev, [tab]: { ...prev[tab], status: "loading" } }));
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          // fallback to default text if missing
          console.warn(`Notes file not found: ${url} (${res.status})`);
          setTabNotes((prev) => ({ ...prev, [tab]: { content: defaultNoteText, status: "fallback" } }));
          return;
        }
        const text = await res.text();
        const content = text && text.trim().length > 0 ? text : defaultNoteText;
        setTabNotes((prev) => ({ ...prev, [tab]: { content, status: "loaded" } }));
      } catch (err) {
        console.error("Error fetching notes", url, err);
        setTabNotes((prev) => ({ ...prev, [tab]: { content: defaultNoteText, status: "error" } }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Platform data memoized
  const platformData = useMemo(
    () => ({
      VMware: vmwareData,
      "Hyper-V": hypervData,
      "Nutanix AHV": nutanixAHVData,
      "Nutanix ESXi": nutanixEsxiData,
      AWS: AWSData,
      Azure: AzureData,
      Proxmox: proxmoxData,
    }),
    [vmwareData, hypervData, nutanixAHVData, nutanixEsxiData, AWSData, AzureData, proxmoxData]
  );

  const data = useMemo(() => platformData[activeTab] || [], [platformData, activeTab]);

  const filteredData = useMemo(
    () =>
      data.filter(
        (row) =>
          (filters.Product === "" || row.Product === filters.Product) &&
          (filters.Release === "" || row.Release === filters.Release) &&
          (filters.Configuration === "" || row.Configuration === filters.Configuration)
      ),
    [data, filters]
  );

  const uniqueValues = (key) => [...new Set(data.map((item) => item[key]).filter(Boolean))];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className="min-h-screen bg-[#F3F5F7] text-[#002B49] p-8"
      style={{ fontFamily: "Segoe UI, Open Sans, sans-serif" }}
    >
      {/* Top bar with logo */}
      <header className="flex items-center bg-[#002B49] text-white px-6 py-3 rounded-md shadow-md mb-8">
        <div className="bg-white p-2 rounded-md mr-4">
          <img src="/mitel-logo.png" alt="Mitel Logo" className="h-10" />
        </div>
        <h1 className="text-2xl font-semibold tracking-wide">
          Mitel Virtual Appliances Server Sizing Information
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center mb-8 border-b border-[#0078D7]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setFilters({ Product: "", Release: "", Configuration: "" });
            }}
            className={`px-6 py-3 text-sm font-semibold transition-all border-t border-x border-[#0078D7] ${
              activeTab === tab
                ? "bg-gradient-to-r from-[#0078D7] to-[#00ADEF] text-white"
                : "bg-white text-[#002B49] hover:bg-[#E6F2FA]"
            }`}
            aria-current={activeTab === tab ? "true" : "false"}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <select
          value={filters.Product}
          onChange={(e) => handleFilterChange("Product", e.target.value)}
          className="border border-[#0078D7] rounded-md px-3 py-2 text-sm text-[#002B49] bg-white focus:ring-2 focus:ring-[#0078D7]"
        >
          <option value="">All Products</option>
          {uniqueValues("Product").map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>

        <select
      value={filters.Release}
      onChange={(e) => handleFilterChange("Release", e.target.value)}
      className="border border-[#0078D7] rounded-md px-3 py-2 text-sm text-[#002B49] bg-white focus:ring-2 focus:ring-[#0078D7]"
    >
      <option value="">All Releases</option>
      {uniqueValues("Release").map((val) => (
        <option key={val} value={val}>
          {val}
        </option>
      ))}
    </select>

    <select
      value={filters.Configuration}
      onChange={(e) => handleFilterChange("Configuration", e.target.value)}
      className="border border-[#0078D7] rounded-md px-3 py-2 text-sm text-[#002B49] bg-white focus:ring-2 focus:ring-[#0078D7]"
    >
      <option value="">All Configurations</option>
      {uniqueValues("Configuration").map((val) => (
        <option key={val} value={val}>
          {val}
        </option>
      ))}
    </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-md shadow-md border border-[#D0D7DE]">
        {data.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {activeTab === "VMware" || activeTab === "Hyper-V"
              ? "Loading data..."
              : "No data available for " + activeTab}
          </div>
        ) : (
          <table className="min-w-full text-sm text-[#002B49]">
            <thead className="bg-[#002B49] text-white uppercase text-xs">
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="px-4 py-3 text-left font-semibold">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b ${i % 2 === 0 ? "bg-[#F8FAFB]" : "bg-white"} hover:bg-[#E6F2FA]`}
                >
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-4 py-2">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes panel (read-only) */}
      <div className="mt-6 bg-white rounded-md shadow-md border border-[#D0D7DE] p-4 text-[#002B49]">
        <h2 className="text-lg font-semibold">Notes — {activeTab}</h2>
        <div className="mt-2 whitespace-pre-wrap text-sm">
          {tabNotes[activeTab] ? tabNotes[activeTab].content : defaultNoteText}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          {/* status indicator */}
          {tabNotes[activeTab] && tabNotes[activeTab].status === "loading" && "Loading notes..."}
          {tabNotes[activeTab] && tabNotes[activeTab].status === "loaded" && "Notes loaded from file."}
          {tabNotes[activeTab] && tabNotes[activeTab].status === "fallback" && "Notes file not found — using default text."}
          {tabNotes[activeTab] && tabNotes[activeTab].status === "error" && "Error loading notes — using default text."}
        </div>
      </div>
    </div>
  );
}
