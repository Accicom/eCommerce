import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  images: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  order: number;
}

export default function Branches() {
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBranch = (branchId: string) => {
    setOpenBranch(openBranch === branchId ? null : branchId);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Nuestras Sucursales
        </h2>

        <div className="max-w-3xl mx-auto space-y-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-900 text-white"
                onClick={() => toggleBranch(branch.id)}
              >
                <span className="font-semibold">{branch.name}</span>
                {openBranch === branch.id ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {openBranch === branch.id && (
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-3" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-5 w-5 mr-3" />
                      <span>{branch.phone}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-3" />
                      <span>{branch.hours}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {branch.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square relative rounded-lg overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${branch.name} - Imagen ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}