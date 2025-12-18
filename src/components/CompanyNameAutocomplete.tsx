"use client";

import * as React from "react";
import { Check, Loader2, Building2 } from "lucide-react";
import { cn } from "./ui/utils";
import { Input } from "./ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./ui/command";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCompanies } from "@/store/slices/companies.slice";
import { useEffect, useState, useRef, useMemo } from "react";

interface CompanyNameAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: (e: FocusEvent) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  error?: boolean;
}

export function CompanyNameAutocomplete({
  value = "",
  onChange,
  onBlur,
  placeholder = "Enter company name",
  className,
  id,
  name,
  error,
}: CompanyNameAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { companies, isLoading } = useAppSelector((state) => state.companies);
  const [allCompanies, setAllCompanies] = useState([] as string[]);
  const [hasFetched, setHasFetched] = useState(false);
  const inputRef = useRef(null as HTMLInputElement | null);
  const popoverRef = useRef(null as HTMLDivElement | null);

  // Fetch companies when dropdown opens for the first time
  useEffect(() => {
    if (open && !hasFetched) {
      const fetchAllCompanies = async () => {
        try {
          const companyNames: string[] = [];
          let page = 1;
          const limit = 100;
          let hasMore = true;
          const maxPages = 10; // Limit to first 1000 companies for performance

          while (hasMore && page <= maxPages) {
            const result = await dispatch(
              getCompanies({ page, limit, background: true })
            ).unwrap();

            if (result.companies && result.companies.length > 0) {
              result.companies.forEach((company: { companyName?: string }) => {
                if (company.companyName && !companyNames.includes(company.companyName)) {
                  companyNames.push(company.companyName);
                }
              });

              if (page >= result.pagination.totalPages) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              hasMore = false;
            }
          }

          setAllCompanies(companyNames.sort());
          setHasFetched(true);
        } catch (error) {
          console.error("Failed to fetch companies:", error);
        }
      };

      fetchAllCompanies();
    }
  }, [open, hasFetched, dispatch]);

  // Filter companies based on input value
  const filteredCompanies = useMemo(() => {
    const searchTerm = value.trim().toLowerCase();
    if (!searchTerm) {
      // Show first 50 companies when no search term
      return allCompanies.slice(0, 50);
    }
    // Filter companies that match the search term
    return allCompanies
      .filter((company: string) =>
        company.toLowerCase().includes(searchTerm)
      )
      .slice(0, 50); // Limit to 50 results
  }, [allCompanies, value]);

  const handleInputChange = (e: { target: { value: string } }) => {
    const newValue = e.target.value;
    onChange(newValue);
    // Always show dropdown when user types
    setOpen(true);
  };

  const handleSelectCompany = (companyName: string) => {
    onChange(companyName);
    setOpen(false);
    // Focus back on input after selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleInputFocus = () => {
    // Always open dropdown on focus
    setOpen(true);
  };

  const handleInputBlur = (e: FocusEvent) => {
    // Check if blur is going to the popover
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (popoverRef.current?.contains(relatedTarget)) {
      return; // Don't close if clicking inside popover
    }
    
    // Delay closing to allow click on suggestion
    setTimeout(() => {
      setOpen(false);
      if (onBlur) {
        onBlur(e);
      }
    }, 200);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className={cn(
          "h-11",
          error && "border-red-500",
          className
        )}
        autoComplete="off"
      />
      {open && (
        <div
          ref={popoverRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
          style={{ 
            top: '100%',
            maxHeight: '300px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
          onMouseDown={(e) => {
            // Prevent input blur when clicking on dropdown
            e.preventDefault();
          }}
        >
          <Command shouldFilter={false}>
            <CommandList className="max-h-full">
              {isLoading && allCompanies.length === 0 && !hasFetched ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading companies...</span>
                </div>
              ) : filteredCompanies.length === 0 && value.trim() ? (
                <CommandEmpty>
                  No companies found. You can create a new company with this name.
                </CommandEmpty>
              ) : filteredCompanies.length === 0 && !value.trim() && allCompanies.length === 0 ? (
                <CommandEmpty>
                  No companies available. Start typing to create a new company.
                </CommandEmpty>
              ) : filteredCompanies.length > 0 ? (
                <>
                  <CommandGroup className="p-1">
                    {filteredCompanies.map((companyName: string) => (
                      <CommandItem
                        key={companyName}
                        value={companyName}
                        onSelect={() => handleSelectCompany(companyName)}
                        className="cursor-pointer"
                      >
                        <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            value === companyName ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {companyName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {value.trim() && !filteredCompanies.includes(value.trim()) && (
                    <div className="border-t p-2">
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Press Enter to create "{value.trim()}"
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <CommandEmpty>
                  Start typing to search companies...
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

