// src/screens/SearchScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Header from '../components/Header';
import JobCard from '../components/JobCard';
import UserCard from '../components/UserCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    jobs: [],
    users: [],
    rooms: [],
  });
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    'React developer',
    'UI/UX designer',
    'Content writer',
    'Mobile developer',
  ]);
  const [popularSearches, setPopularSearches] = useState([
    'Remote jobs',
    'Freelancers',
    'Designers',
    'Developers',
    'React',
    'Python',
  ]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsLoading(true);
    try {
      const response = await api.get('/search', {
        params: { q: query },
      });
      setSearchResults(response.data || { jobs: [], users: [], rooms: [] });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!recentSearches.includes(query)) {
      setRecentSearches((prev) => [query, ...prev].slice(0, 10));
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ jobs: [], users: [], rooms: [] });
  };

  const removeRecentSearch = (searchToRemove) => {
    setRecentSearches((prev) => prev.filter((s) => s !== searchToRemove));
  };

  const hasResults =
    searchResults.jobs.length > 0 ||
    searchResults.users.length > 0 ||
    searchResults.rooms.length > 0;

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search VivaWorks..."
          placeholderTextColor={COLORS.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {['all', 'jobs', 'talent', 'rooms'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          >
            {tab === 'all'
              ? 'All'
              : tab === 'jobs'
              ? 'Jobs'
              : tab === 'talent'
              ? 'Talent'
              : 'Rooms'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecentSearches = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent searches</Text>
        <TouchableOpacity onPress={() => setRecentSearches([])}>
          <Text style={styles.clearAll}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchTags}>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.searchTag}
            onPress={() => handleSearch(search)}
          >
            <Text style={styles.searchTagText}>{search}</Text>
            <TouchableOpacity
              style={styles.removeTag}
              onPress={() => removeRecentSearch(search)}
            >
              <Text style={styles.removeTagText}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPopularSearches = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Popular searches</Text>
      <View style={styles.searchTags}>
        {popularSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.searchTag, styles.popularTag]}
            onPress={() => handleSearch(search)}
          >
            <Text style={[styles.searchTagText, styles.popularTagText]}>
              {search}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAllResults = () => (
    <ScrollView>
      {searchResults.jobs.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Jobs</Text>
          {searchResults.jobs.slice(0, 3).map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onPress={() => navigation.navigate('JobDetail', { jobId: job._id })}
            />
          ))}
        </View>
      )}

      {searchResults.users.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Talent</Text>
          {searchResults.users.slice(0, 3).map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onPress={() => {}}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderTabResults = () => {
    switch (activeTab) {
      case 'jobs':
        return (
          <FlatList
            data={searchResults.jobs}
            renderItem={({ item }) => (
              <JobCard
                job={item}
                onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
              />
            )}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={<EmptyState.NoResults />}
          />
        );
      case 'talent':
        return (
          <FlatList
            data={searchResults.users}
            renderItem={({ item }) => <UserCard user={item} onPress={() => {}} />}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={<EmptyState.NoResults />}
          />
        );
      default:
        return renderAllResults();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Search"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {renderSearchBar()}

      {searchQuery ? (
        <>
          {renderTabs()}
          {isLoading ? (
            <Loading text="Searching..." />
          ) : hasResults ? (
            renderTabResults()
          ) : (
            <EmptyState.NoResults />
          )}
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {recentSearches.length > 0 && renderRecentSearches()}
          {renderPopularSearches()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  searchContainer: {
    padding: SIZES.md,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SIZES.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body1,
    color: COLORS.textPrimary,
  },
  clearIcon: {
    fontSize: 18,
    color: COLORS.textTertiary,
    padding: SIZES.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tab: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    marginRight: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    padding: SIZES.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  clearAll: {
    ...FONTS.body2,
    color: COLORS.primary,
  },
  searchTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  searchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  popularTag: {
    backgroundColor: COLORS.primaryLight,
  },
  searchTagText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  popularTagText: {
    color: COLORS.primary,
  },
  removeTag: {
    marginLeft: SIZES.xs,
    padding: 2,
  },
  removeTagText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  resultsSection: {
    marginBottom: SIZES.lg,
  },
  resultsTitle: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
});

export default SearchScreen;