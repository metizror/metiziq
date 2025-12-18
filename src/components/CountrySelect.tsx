"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { useCountries, type Country } from "@/hooks/useCountries";

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country...",
  className,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const { countries, isLoading, error } = useCountries();

  const selectedCountry = value || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11",
            !selectedCountry && "text-muted-foreground",
            className
          )}
        >
          {selectedCountry || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={8}
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command shouldFilter={true}>
          <CommandInput 
            placeholder="Search country..." 
            className="h-9 border-b"
          />
          <div style={{ maxHeight: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
            <CommandList className="max-h-full">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading countries...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="p-1">
                  {countries.map((country: Country) => (
                <CommandItem
                      key={country._id || country.name}
                      value={country.name}
                  onSelect={() => {
                        onValueChange(country.name === selectedCountry ? "" : country.name);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                          selectedCountry === country.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                      {country.name}
                </CommandItem>
              ))}
              <CommandItem
                value="Other"
                onSelect={() => {
                  onValueChange(selectedCountry === "Other" ? "" : "Other");
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    selectedCountry === "Other" ? "opacity-100" : "opacity-0"
                  )}
                />
                Other
              </CommandItem>
            </CommandGroup>
              </>
            )}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

